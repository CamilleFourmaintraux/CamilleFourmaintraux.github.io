import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { recordPage } from "./visitorContext";

export default function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => recordPage(pathname), [pathname]);
  return null;
}
