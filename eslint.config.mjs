import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["scripts/**", "tests/**", "fixtures/**", ".next/**"],
  },
  {
    rules: {
      // Flags the standard `setLoading(true)` fetch-in-effect pattern, pushing
      // toward Suspense/data-fetching libraries. This MVP deliberately uses
      // plain useState + fetch (no React Query) per the project's scope.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
