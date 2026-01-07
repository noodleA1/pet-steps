/**
 * App Asset URLs
 * Background images and other visual assets
 */

export const BACKGROUND_IMAGES = {
  home: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/CxSIdtPTlLOaUARK.png",
  battle: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/ylICkHzLpLzxYQew.png",
  steps: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/IpSeonmMNlPyoeGy.png",
} as const;

// Local asset paths (for bundled assets)
export const LOCAL_ASSETS = {
  pets: {
    fire: require("@/assets/images/pets/fire-pet.png"),
    water: require("@/assets/images/pets/water-pet.png"),
    earth: require("@/assets/images/pets/earth-pet.png"),
    air: require("@/assets/images/pets/air-pet.png"),
  },
  backgrounds: {
    home: require("@/assets/images/backgrounds/home-bg.png"),
    battle: require("@/assets/images/backgrounds/battle-bg.png"),
    steps: require("@/assets/images/backgrounds/steps-bg.png"),
  },
} as const;
