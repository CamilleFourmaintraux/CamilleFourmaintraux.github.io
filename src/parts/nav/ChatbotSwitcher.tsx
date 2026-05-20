import { useMatch, useNavigate } from "react-router-dom";

export default function ChatbotSwitcher() {
  let navigate = useNavigate();
  const match = useMatch("chatbot");

  function togglechat() {
    if (match) {
      navigate(`/home`);
    } else {
      navigate(`/chatbot`);
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
