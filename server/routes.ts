import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { setupFhirAuth } from "./fhir";
import { db } from "@db";
import { 
  patients, 
  medicalInteractions, 
  collaborationSessions,
  sessionParticipants,
  collaborationMessages,
  insertPatientSchema,
  patientProfileSchema 
} from "@db/schema";
import { eq, and } from "drizzle-orm";
import { getMedicalDiagnostic } from "./openai";
import * as crypto from 'crypto';

export function registerRoutes(app: Express): Server {
  // Setup FHIR auth first to ensure JWKS endpoint is available
  setupFhirAuth(app);

  setupAuth(app);

  // Get current user session
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Create a new patient (doctors only)
  app.post("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user?.role !== "doctor") {
      return res.status(403).send("Only doctors can create patients");
    }

    try {
      const { name, email, phone, dateOfBirth, visitContext, fhirData } = req.body;

      // Create the patient with basic info
      const [patient] = await db
        .insert(patients)
        .values({
          userId: req.user.id,
          fhirData: fhirData ? JSON.parse(fhirData) : {
            resourceType: "Patient",
            name: [{ given: [name] }],
            telecom: [
              { system: "email", value: email },
              { system: "phone", value: phone }
            ],
            birthDate: dateOfBirth
          },
          keyPair: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // If there's an initial visit context, create a medical interaction
      if (visitContext) {
        await db.insert(medicalInteractions).values({
          patientId: patient.id,
          doctorId: req.user.id,
          context: visitContext,
          createdAt: new Date()
        });
      }

      res.json(patient);
    } catch (error: any) {
      console.error("Patient creation error:", error);
      res.status(500).send(error.message);
    }
  });

  // Get all patients (doctors only)
  app.get("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user?.role !== "doctor") {
      return res.status(403).send("Only doctors can view all patients");
    }

    try {
      const allPatients = await db.select().from(patients);
      res.json(allPatients);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      res.status(500).send(error.message);
    }
  });

  // Get specific patient
  app.get("/api/patients/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const patientId = parseInt(req.params.id);
      const [patient] = await db
        .select()
        .from(patients)
        .where(
          req.user.role === "patient"
            ? eq(patients.userId, req.user.id)
            : eq(patients.id, patientId)
        );

      if (!patient) {
        return res.status(404).send("Patient not found");
      }

      // For patient users, only allow access to their own profile
      if (req.user.role === "patient" && patient.userId !== req.user.id) {
        return res.status(403).send("Unauthorized");
      }

      res.json(patient);
    } catch (error: any) {
      console.error("Error fetching patient:", error);
      res.status(500).send(error.message);
    }
  });

  // Update patient profile
  app.post("/api/patients/profile", async (req, res) => {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).send("Only patients can update their own profile");
    }

    try {
      // Validate the request body against the schema
      const validatedData = patientProfileSchema.parse(req.body);

      // Check if patient profile exists
      let [existingPatient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id));

      if (!existingPatient) {
        // Create new patient profile
        [existingPatient] = await db
          .insert(patients)
          .values({
            userId: req.user.id,
            ...validatedData,
            keyPair: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      } else {
        // Update existing patient profile
        [existingPatient] = await db
          .update(patients)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(patients.userId, req.user.id))
          .returning();
      }

      res.json(existingPatient);
    } catch (error: any) {
      console.error("Profile update error:", error);
      if (error.errors) {
        // Zod validation error
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send(error.message);
      }
    }
  });

  // Get diagnostic assistance
  app.post("/api/diagnostic/:patientId", async (req, res) => {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    const patientId = parseInt(req.params.patientId);
    const { context } = req.body;

    if (!context) {
      return res.status(400).send("Context is required");
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId));

    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    try {
      const diagnosticResponse = await getMedicalDiagnostic(
        context,
        patient.fhirData
      );

      // Store the interaction
      await db.insert(medicalInteractions).values({
        patientId,
        doctorId: req.user.id,
        context,
        llmResponse: diagnosticResponse,
        confidence: diagnosticResponse.confidence.toString(),
        createdAt: new Date()
      });

      res.json(diagnosticResponse);
    } catch (error: any) {
      console.error("Diagnostic API error:", error);

      // Check for specific OpenAI errors
      if (error.status === 429) {
        return res.status(503).send("The AI service is currently unavailable. Please try again later.");
      }

      res.status(500).send(error.message || "Failed to get diagnostic insights");
    }
  });

  // Create a new collaboration session
  app.post("/api/collaboration/sessions", async (req, res) => {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    const { patientId, title } = req.body;

    try {
      const [session] = await db
        .insert(collaborationSessions)
        .values({
          patientId,
          createdById: req.user.id,
          title,
        })
        .returning();

      // Add the creator as a participant
      await db.insert(sessionParticipants).values({
        sessionId: session.id,
        doctorId: req.user.id,
      });

      res.json(session);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get collaboration sessions for a patient
  app.get("/api/collaboration/sessions/:patientId", async (req, res) => {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    const patientId = parseInt(req.params.patientId);

    try {
      const sessions = await db
        .select()
        .from(collaborationSessions)
        .where(eq(collaborationSessions.patientId, patientId));

      res.json(sessions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get messages for a collaboration session
  app.get("/api/collaboration/messages/:sessionId", async (req, res) => {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    const sessionId = parseInt(req.params.sessionId);

    try {
      const messages = await db
        .select()
        .from(collaborationMessages)
        .where(eq(collaborationMessages.sessionId, sessionId))
        .orderBy(collaborationMessages.createdAt);

      res.json(messages);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}