import FHIR from 'fhirclient';
import type { Express, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import * as jose from 'node-jose';
import { db } from "@db";
import { patients } from "@db/schema";
import { eq } from "drizzle-orm";

// Create a keystore for managing our JWKs
const keyStore = jose.default.JWK.createKeyStore();
let currentKey: jose.JWK.Key;

// Initialize the keystore with an RSA key
async function initializeKeyStore() {
  try {
    currentKey = await keyStore.generate('RSA', 2048, {
      use: 'sig',
      alg: 'RS256'
    });
    console.log('JWKS keystore initialized successfully');
  } catch (error) {
    console.error('Failed to initialize JWKS keystore:', error);
    throw error;
  }
}

// Helper to get the application URL
function getAppUrl(): string {
  return process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL || '' 
    : 'http://localhost:5000';
}

export async function setupFhirAuth(app: Express) {
  // Initialize our keystore
  await initializeKeyStore();

  // JWKS endpoint
  app.get('/.well-known/jwks.json', async (_req: Request, res: Response) => {
    try {
      const jwks = await keyStore.toJSON(false);
      console.log('Serving JWKS:', JSON.stringify(jwks, null, 2));
      res.json(jwks);
    } catch (error) {
      console.error('Error serving JWKS:', error);
      res.status(500).send('Error generating JWKS');
    }
  });

  // EPIC OAuth2 callback endpoint
  app.get('/api/auth/epic/callback', async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || !state || typeof state !== 'string') {
        return res.status(400).send('Invalid callback parameters');
      }

      // Retrieve the stored state
      const stateData = stateStore.get(state);
      if (!stateData) {
        return res.status(400).send('Invalid state parameter');
      }

      const { doctorId, patientId } = stateData;

      // Complete the OAuth2 flow and get the FHIR client
      const client = await FHIR.oauth2.completeAuthorizationFlow(code.toString(), state);

      // Get the access token
      const { accessToken } = client.getState();

      // Update the patient record with the FHIR authorization token
      await db
        .update(patients)
        .set({
          fhirAuth: {
            accessToken,
            updatedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(eq(patients.id, patientId));

      // Clear the state from storage
      stateStore.delete(state);

      // Redirect back to the application
      res.redirect(`/patients/${patientId}`);
    } catch (error) {
      console.error('FHIR authorization error:', error);
      res.status(500).send('Failed to complete FHIR authorization');
    }
  });

  // Initiate EPIC authorization
  app.post('/api/auth/epic/authorize/:patientId', async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).send('Only doctors can initiate FHIR authorization');
    }

    const patientId = parseInt(req.params.patientId);

    try {
      // Generate a unique state for this authorization request
      const state = jwt.sign(
        { doctorId: req.user.id, patientId }, 
        process.env.JWT_SECRET || 'development-secret',
        { 
          expiresIn: '1h',
          algorithm: 'RS256',
          keyid: currentKey.kid
        }
      );

      // Store the state
      stateStore.set(state, {
        doctorId: req.user.id,
        patientId
      });

      // Initialize FHIR client with EPIC's OAuth2 endpoint
      const client = await FHIR.oauth2.authorize({
        clientId: process.env.EPIC_CLIENT_ID || 'development-client-id',
        scope: 'launch/patient patient/*.read',
        redirectUri: `${getAppUrl()}/api/auth/epic/callback`,
        state,
        iss: process.env.EPIC_FHIR_URL,
        jwksUrl: `${getAppUrl()}/.well-known/jwks.json`
      });

      res.json({ authUrl: client.authorizeUrl });
    } catch (error) {
      console.error('Failed to initiate FHIR authorization:', error);
      res.status(500).send('Failed to initiate FHIR authorization');
    }
  });
}

const stateStore = new Map<string, {
  doctorId: number;
  patientId: number;
}>();