import type { User as AuthUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";

/** Map Supabase auth.users.id onto Prisma User.id (UUID). */
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

  return prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name,
      image:
        typeof authUser.user_metadata?.avatar_url === "string"
          ? authUser.user_metadata.avatar_url
          : null,
      emailVerified,
    },
    update: {
      email,
      name: name ?? undefined,
      emailVerified,
    },
  });
}
