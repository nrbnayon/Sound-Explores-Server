/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { appConfig } from "../config";
const multerErrorHandler = (err: any) => {
  const statusCode = 400;
  const message = "Multer Error";
  const errors: { field: string; message: string }[] = [];
  if (err.code === "LIMIT_FILE_SIZE") {
    const bytes = Number(appConfig.multer.file_size_limit);
    const megabytes = bytes / (1024 * 1024);

    errors.push({
      field: "",
      message: `File size exceeds the limit of ${megabytes} mb`,
    });
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    errors.push({
      field: "",
      message: `You can upload a maximum of ${appConfig.multer.max_file_number} files`,
    });
  }

  return { statusCode, message, errors };
};
export default multerErrorHandler;
