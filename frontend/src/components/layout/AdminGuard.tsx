"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload {
  sub: number;
  email: string;
  role: string;
  exp?: number;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/");
      return;
    }

    try {
      const payload = jwtDecode<CustomJwtPayload>(token);

      if (payload.role !== "Admin") {
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.push("/");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-blanc">
        <div className="w-12 h-12 border-4 border-champagne/20 border-t-or rounded-full animate-spin"></div>
        <p className="mt-4 font-montserrat font-bold text-sm text-champagne uppercase tracking-widest">
          Vérification des habilitations...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}