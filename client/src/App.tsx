import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VotingSystemApp from "@/components/VotingSystemApp";
import NotFound from "@/pages/not-found";

// Import examples for development viewing
import HeaderExample from "@/components/examples/Header";
import LoginFormExample from "@/components/examples/LoginForm";
import ElectionCardExample from "@/components/examples/ElectionCard";
import VotingModalExample from "@/components/examples/VotingModal";
import AdminDashboardExample from "@/components/examples/AdminDashboard";

function Router() {
  return (
    <Switch>
      {/* Main application route */}
      <Route path="/" component={VotingSystemApp} />
      
      {/* Component examples for development */}
      <Route path="/examples/header" component={HeaderExample} />
      <Route path="/examples/login" component={LoginFormExample} />
      <Route path="/examples/elections" component={ElectionCardExample} />
      <Route path="/examples/voting" component={VotingModalExample} />
      <Route path="/examples/admin" component={AdminDashboardExample} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
