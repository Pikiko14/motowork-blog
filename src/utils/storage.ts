import path from 'path';
import multer from 'multer';
import { Utils } from './utils';

const utils = new Utils();
const dirpath = process.cwd();

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let path = req.originalUrl ? await utils.getPath(req.originalUrl) : await utils.getPath(req.baseUrl);
    cb(null, `${dirpath}/uploads/${path}`);
  },
  filename: function (req, file, cb) {
    const numberRandom = Math.floor(Math.random() * 100000000000) + 1;
    cb(null, `${file.fieldname}-${Date.now()}-${numberRandom}${path.extname(file.originalname)}`);
  }
});
  
export const upload = multer({ storage: storage });