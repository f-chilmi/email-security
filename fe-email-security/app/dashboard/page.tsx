"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { wsClient } from "@/lib/websocket";
import Navbar from "@/components/Navbar";
import DomainCard from "@/components/DomainCard";
import AddDomainModal from "@/components/AddDomainModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

interface Domain {
  id: string;
  domainName: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (token) {
      wsClient.connect(token);
      loadDomains();
    }
  }, [token]);

  const loadDomains = async () => {
    try {
      const response = await api.get("/domains");
      setDomains(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (domainName: string) => {
    try {
      const response = await api.post("/domains", { domainName });
      setDomains([response.data, ...domains]);
      setShowAddModal(false);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Domains</h1>
            <p className="text-gray-300">
              Monitor email security for your domains
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className=" bg-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-600 text-white"
          >
            Add Domain
          </button>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError("")} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <DomainCard key={domain.id} domain={domain} />
          ))}
        </div>

        {domains.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-800 backdrop-blur-sm rounded-lg p-8">
              <h3 className="text-xl font-medium text-white mb-2">
                No domains yet
              </h3>
              <p className="text-gray-300 mb-4">
                Add your first domain to start monitoring email security
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gray-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600"
              >
                Add Domain
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDomainModal
          onAdd={handleAddDomain}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
