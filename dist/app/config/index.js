"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.appConfig = {
    database: { dataBase_uri: process.env.DATABASE_URI },
    server: {
        port: process.env.PORT,
        node_env: process.env.NODE_ENV,
        ip: process.env.IP_ADDRESS,
    },
    jwt: {
        jwt_access_secret: process.env.JWT_ACCESS_SECRET,
        jwt_access_exprire: process.env.JWT_ACCESS_EXPIRE,
        jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
        jwt_refresh_exprire: process.env.JWT_REFRESH_EXPIRE,
    },
    bcrypt: {
        salt_round: process.env.SALT_ROUND,
    },
    email: {
        from: process.env.EMAIL_FROM,
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    multer: {
        file_size_limit: process.env.MAX_FILE_SIZE,
        max_file_number: process.env.MAX_COUNT_FILE,
    },
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    },
};
