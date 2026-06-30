const NavigationConfig = {
  0: [
    // Viewer / not logged in
    {},
  ],
  1: [
    // User
    { name: "Home", to: "/userdashboard", submenus: null },
    {
      name: "Jobs",
      submenus: [
        { name: "View Jobs", to: "/jobs" },
        { name: "Your Applications", to: "/applications" },
      ],
    },
    {
      name: "Cover Letter",
      to: "/coverletter",
      submenus: null,
    },
    { name: "Chat", to: "/chat", submenus: null },
  ],
};

export const getNavigationConfig = (userType) => {
  const config = NavigationConfig?.[userType];
  return Array.isArray(config) ? config : NavigationConfig[0];
};

