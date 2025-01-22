import { pgTable, text, serial, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["doctor", "patient"] }).notNull().default("patient"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  fullName: text("full_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  fhirData: jsonb("fhir_data"),
  keyPair: text("key_pair").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const authorizations = pgTable("authorizations", {
  id: serial("id").primaryKey(),
  patientId: serial("patient_id").references(() => patients.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  signedAt: timestamp("signed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalInteractions = pgTable("medical_interactions", {
  id: serial("id").primaryKey(),
  patientId: serial("patient_id").references(() => patients.id),
  doctorId: serial("doctor_id").references(() => users.id),
  context: text("context").notNull(),
  llmResponse: jsonb("llm_response"),
  confidence: text("confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  isTrainingData: boolean("is_training_data").default(false),
});

export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  patientId: serial("patient_id").references(() => patients.id),
  createdById: serial("created_by_id").references(() => users.id),
  title: text("title").notNull(),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessionParticipants = pgTable("session_participants", {
  id: serial("id").primaryKey(),
  sessionId: serial("session_id").references(() => collaborationSessions.id),
  doctorId: serial("doctor_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const collaborationMessages = pgTable("collaboration_messages", {
  id: serial("id").primaryKey(),
  sessionId: serial("session_id").references(() => collaborationSessions.id),
  senderId: serial("sender_id").references(() => users.id),
  content: text("content").notNull(),
  type: text("type", { enum: ["chat", "diagnostic", "note"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patientProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone must be at least 10 digits"),
  emergencyContactRelation: z.string().min(1, "Emergency contact relation is required"),
});

export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(["doctor", "patient"]).default("patient"),
});
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertPatientSchema = createInsertSchema(patients, {
  ...patientProfileSchema.shape,
});
export const selectPatientSchema = createSelectSchema(patients);
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export const insertInteractionSchema = createInsertSchema(medicalInteractions);
export const selectInteractionSchema = createSelectSchema(medicalInteractions);
export type MedicalInteraction = typeof medicalInteractions.$inferSelect;
export type NewMedicalInteraction = typeof medicalInteractions.$inferInsert;

export const insertSessionSchema = createInsertSchema(collaborationSessions);
export const selectSessionSchema = createSelectSchema(collaborationSessions);
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type NewCollaborationSession = typeof collaborationSessions.$inferInsert;

export const insertMessageSchema = createInsertSchema(collaborationMessages);
export const selectMessageSchema = createSelectSchema(collaborationMessages);
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type NewCollaborationMessage = typeof collaborationMessages.$inferInsert;

export const insertAuthorizationSchema = createInsertSchema(authorizations);
export const selectAuthorizationSchema = createSelectSchema(authorizations);
export type Authorization = typeof authorizations.$inferSelect;
export type NewAuthorization = typeof authorizations.$inferInsert;