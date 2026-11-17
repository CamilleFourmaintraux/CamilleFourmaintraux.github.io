import { legacyPath } from "@/lib/paths";
import { useMatch, useNavigate } from "react-router-dom";

export default function ChatbotSwitcher() {
  const navigate = useNavigate();
  const match = useMatch(legacyPath("/chatbot"));

  function togglechat() {
    if (match) {
      navigate(legacyPath("/"));
    } else {
      navigate(legacyPath("/chatbot"));
    }
  }

  function Icon() {
    // Utilisation de `useMatch` pour vérifier si le lien est actif
    return <span>{match ? "🏠" : "🤖"}</span>;
  }

  return (
    <button onClick={togglechat} id="chatSwitcher">
      {Icon()}
    </button>
  );
}
