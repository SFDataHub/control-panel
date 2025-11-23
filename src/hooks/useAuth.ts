type DemoUser = {
  id: string;
  displayName: string;
  role: string;
};

type UseAuthResult = {
  user: DemoUser;
  isLoading: boolean;
};

export default function useAuth(): UseAuthResult {
  return {
    user: {
      id: "demo-admin",
      displayName: "Demo Admin",
      role: "admin",
    },
    isLoading: false,
  };
}
