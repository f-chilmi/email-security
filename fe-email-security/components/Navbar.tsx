"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Email Security</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
