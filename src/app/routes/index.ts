import { Router } from "express";
import { UserRoute } from "../modules/users/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { SoundRoute } from "../modules/sound/sound.route";
import { UserConnectionRoute } from "../modules/users/userConnection/userConnection.route";
import { SendMessageRoute } from "../modules/sendMessge/sendMessage.route";

const router = Router();
const apiRoutes = [
  { path: "/user", route: UserRoute },
  { path: "/auth", route: AuthRoute },
  { path: "/sound", route: SoundRoute },
  { path: "/user-connection", route: UserConnectionRoute },
  { path: "/message", route: SendMessageRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
