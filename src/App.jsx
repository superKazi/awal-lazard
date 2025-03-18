import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chart } from "./Chart";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Chart />
    </QueryClientProvider>
  );
};
