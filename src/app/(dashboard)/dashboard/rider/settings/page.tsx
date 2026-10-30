import React from "react";
import RiderSettingsClient from "./RiderSettingsClient";
import { getRequiredRole } from "@/lib/core/session";
import { getUserById } from "@/lib/api/user";

export const dynamic = "force-dynamic";

/** Only the fields this page needs from the user document. */
interface RiderRecord {
  _id?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
  availability?: string | null;
}

export default async function RiderSettingsPage() {
  const session = await getRequiredRole("rider");

  let record: RiderRecord | null = null;
  try {
    const res = await getUserById(session.id);
    record = (res?.data as RiderRecord) ?? null;
  } catch {
    // The session still gives us the availability default and the email.
  }

  const merged: RiderRecord = record ?? {
    id: session.id,
    name: session.name,
    email: session.email,
  };

  return (
    <RiderSettingsClient
      riderId={merged._id || merged.id || session.id}
      riderName={merged.name || session.name || "Rider"}
      email={merged.email || session.email || ""}
      availability={merged.availability === "offline" ? "offline" : "online"}
    />
  );
}
