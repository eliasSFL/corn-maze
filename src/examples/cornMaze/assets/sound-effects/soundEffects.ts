/**
 * SFX URLs for Chicken Rescue (hosted on PROTECTED_IMAGE_URL CDN).
 */
import { CONFIG } from "lib/config";

const sfx = (path: string) => `${CONFIG.PROTECTED_IMAGE_URL}${path}`;

export type Footsteps = "dirt_footstep" | "wood_footstep" | "sand_footstep";

export const SOUNDS = {
  footsteps: {
    dirt: sfx(
      "/sfx/Footsteps/Dirt/Farm_Game_Footsteps_Dirt_1_Soil_Walk_Run_Ground_Surface.mp3",
    ),
    wood: sfx(
      "/sfx/Footsteps/Wood/Farm_Game_Footsteps_Wood_5_House_Walk_Run_Ground_Surface.mp3",
    ),
    sand: sfx(
      "/sfx/Footsteps/Sand/Farm_Game_Footsteps_Sand_5_Beach_Walk_Run_Ground_Surface.mp3",
    ),
  },
  loops: {
    nature_1: sfx("/sfx/Loops/Nature Loops/ambience_birds_crickets.mp3"),
    engine: sfx(
      "/sfx/Loops/Mechanical Loops/Farm_Game_Loop_Mechanical_Engine_Tractor_Drive_1.mp3",
    ),
  },
  desert: {
    dig: sfx(
      "/sfx/Farming/Dig/Farm_Game_Farming_Dig_Hoe_Soil_Dirt_1_Garden.mp3",
    ),
    drill: sfx(
      "/sfx/Farming/Engines/Farm_Game_Farming_Tool_Engine_Contraption_Other_Garden_Machine_1_Device_Craft.mp3",
    ),
    reveal: sfx(
      "/sfx/Menu_UI/Collects/Farm_Game_User_Interface_Collect_Item_1_Click_Pop_Fun_Cartoon.mp3",
    ),
  },
  notifications: {
    maze_over: sfx(
      "/sfx/Fishing/Notification/Farm_Game_Fishing_Notification_Negative_Unsuccessful_Catch_3_Fail_Capture_Sad_Complete_Fish.mp3",
    ),
    crow_collected: sfx("/sfx/Notifications/crow_collected.mp3"),
  },
  voices: {
    ouph: sfx(
      "/sfx/Animals/Human/Farm_Game_Animal_Vocal_Human_Character_Voice_Farmer_Ouph_Pain.mp3",
    ),
  },
  resources: {
    chicken_1: sfx(
      "/sfx/Animals/Bird/Bird_Chicken_Cluck_Chirp_Vocalization_1.mp3",
    ),
    chicken_2: sfx(
      "/sfx/Animals/Bird/Bird_Chicken_Cluck_Chirp_Vocalization_2.mp3",
    ),
  },
} as const;
