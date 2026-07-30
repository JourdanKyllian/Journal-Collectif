import { CheckCircle2, AlertTriangle } from "lucide-react";

export interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

interface FeedbackAlertProps {
  feedback: FeedbackMessage | null;
}

/**
 * Affiche une bannière de notification standardisée pour les retours d'actions (formulaires, API).
 * 
 * @param {FeedbackAlertProps} props - L'objet contenant le statut (success/error) et le message.
 * @returns {JSX.Element | null} Le composant rendu ou null si aucun message n'est fourni.
 */
export function FeedbackAlert({ feedback }: FeedbackAlertProps) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";

  return (
    <div
      className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-montserrat font-bold text-sm shadow-sm animate-in fade-in duration-300 border ${
        isSuccess
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
      role="alert"
    >
      {isSuccess ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      {feedback.message}
    </div>
  );
}
