"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthButtons({ isSignedIn, mobile }: { isSignedIn: boolean; mobile?: boolean }) {
  if (isSignedIn) {
    return (
      <div className={mobile ? "flex justify-center items-center" : undefined}>
        <UserButton />
      </div>
    );
  }

  return (
    <>
      <SignInButton mode="modal">
        <button
          className={
            mobile
              ? "flex-1 py-2.5 text-xs tracking-[0.15em] text-brown border border-brown rounded-full"
              : "px-5 py-2.5 text-xs tracking-[0.15em] text-brown border border-brown rounded-full hover:bg-brown hover:text-cream transition-colors"
          }
        >
          SIGN IN
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          className={
            mobile
              ? "flex-1 py-2.5 text-xs tracking-[0.15em] text-cream bg-olive rounded-full"
              : "px-5 py-2.5 text-xs tracking-[0.15em] text-cream bg-olive rounded-full hover:bg-brown transition-colors"
          }
        >
          JOIN
        </button>
      </SignUpButton>
    </>
  );
}
