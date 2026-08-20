import type { User as AuthUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";

/** Map Supabase auth.users.id onto Prisma User.id (UUID). Read first; write only when needed. */
export async function ensurePrismaUser(authUser: AuthUser) {
  const email = authUser.email?.toLowerCase();
  if (!email) {
    throw new Error("Authenticated user has no email");
  }

  const name =
    (typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : null) ||
    authUser.email?.split("@")[0] ||
    null;

  const emailVerified = authUser.email_confirmed_at
    ? new Date(authUser.email_confirmed_at)
    : null;
  const image =
    typeof authUser.user_metadata?.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : null;

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
  });
  if (
    existing &&
    existing.email === email &&
    existing.name === name &&
    existing.image === image
  ) {
    return existing;
  }

  return prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name,
      image,
      emailVerified,
    },
    update: {
      email,
      name: name ?? undefined,
      image: image ?? undefined,
      emailVerified,
    },
  });
}
