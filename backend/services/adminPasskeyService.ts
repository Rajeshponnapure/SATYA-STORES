import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { AdminPasskey } from "../types";
import { userService } from "./userService";

function frontendOrigin(): string {
  const configured = (process.env.ADMIN_WEBAUTHN_ORIGIN || process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("ADMIN_WEBAUTHN_ORIGIN or FRONTEND_URL must be configured for passkeys.");
}

function relyingPartyId(): string {
  const configured = (process.env.ADMIN_WEBAUTHN_RP_ID || "").trim();
  return configured || new URL(frontendOrigin()).hostname;
}

function cleanDeviceName(name: unknown): string {
  if (typeof name !== "string") return "Approved device";
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, 80) : "Approved device";
}

export const adminPasskeyService = {
  async registrationOptions() {
    const passkeys = await userService.getAdminPasskeys();
    const options = await generateRegistrationOptions({
      rpName: "Satya Stores Admin",
      rpID: relyingPartyId(),
      userID: new TextEncoder().encode("satya-store-owner"),
      userName: "store-owner",
      userDisplayName: "Satya Stores Owner",
      attestationType: "none",
      timeout: 60_000,
      excludeCredentials: passkeys.map((passkey) => ({ id: passkey.id, transports: passkey.transports })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      supportedAlgorithmIDs: [-7, -257],
      preferredAuthenticatorType: "localDevice",
    });
    return options;
  },

  async verifyRegistration(response: RegistrationResponseJSON, expectedChallenge: string, deviceName: unknown): Promise<{ verified: boolean; error?: string }> {
    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: frontendOrigin(),
        expectedRPID: relyingPartyId(),
        requireUserVerification: true,
        supportedAlgorithmIDs: [-7, -257],
      });
      if (!verification.verified || !verification.registrationInfo) {
        return { verified: false, error: "This device could not be verified." };
      }

      const info = verification.registrationInfo;
      // Synced passkeys can appear on other devices. The requested policy is
      // device-bound access, so accept only non-backed-up single-device keys.
      if (info.credentialDeviceType !== "singleDevice" || info.credentialBackedUp) {
        return { verified: false, error: "Use a device-bound passkey or a hardware security key; synced passkeys are not allowed for this admin portal." };
      }

      const passkey: AdminPasskey = {
        id: info.credential.id,
        publicKey: Buffer.from(info.credential.publicKey).toString("base64url"),
        counter: info.credential.counter,
        transports: info.credential.transports,
        deviceType: "singleDevice",
        backedUp: false,
        name: cleanDeviceName(deviceName),
        createdAt: new Date().toISOString(),
      };
      await userService.addAdminPasskey(passkey);
      return { verified: true };
    } catch (error) {
      console.error("[Passkey] Registration verification failed:", error);
      return { verified: false, error: error instanceof Error ? error.message : "Device registration failed." };
    }
  },

  async authenticationOptions() {
    const passkeys = await userService.getAdminPasskeys();
    if (!passkeys.length) throw new Error("No approved device is registered yet.");
    const options = await generateAuthenticationOptions({
      rpID: relyingPartyId(),
      timeout: 60_000,
      userVerification: "required",
      allowCredentials: passkeys.map((passkey) => ({ id: passkey.id, transports: passkey.transports })),
    });
    return options;
  },

  async verifyAuthentication(response: AuthenticationResponseJSON, expectedChallenge: string): Promise<{ verified: boolean; error?: string }> {
    try {
      const passkeys = await userService.getAdminPasskeys();
      const passkey = passkeys.find((item) => item.id === response.id);
      if (!passkey) return { verified: false, error: "This device is not approved for the admin portal." };

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: frontendOrigin(),
        expectedRPID: relyingPartyId(),
        requireUserVerification: true,
        credential: {
          id: passkey.id,
          publicKey: Buffer.from(passkey.publicKey, "base64url"),
          counter: passkey.counter,
          transports: passkey.transports as any,
        },
      });
      if (!verification.verified || verification.authenticationInfo.credentialDeviceType !== "singleDevice" || verification.authenticationInfo.credentialBackedUp) {
        return { verified: false, error: "This device verification was rejected." };
      }
      await userService.updateAdminPasskeyUsage(passkey.id, verification.authenticationInfo.newCounter);
      return { verified: true };
    } catch (error) {
      console.error("[Passkey] Authentication verification failed:", error);
      return { verified: false, error: error instanceof Error ? error.message : "Device verification failed." };
    }
  },
};
