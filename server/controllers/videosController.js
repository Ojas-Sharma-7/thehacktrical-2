import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import catchAsync from './catchAsync.js';
import Video from '../models/videosModel.js';
import { checkPathExists } from '../utils/fileSystem.js';

// MULTER FUNCTIONS
const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const path = file.mimetype.startsWith('image') ? 'public/uploads/images' : 'public/uploads/videos';

    const folderExists = await checkPathExists(path);
    if (!folderExists) {
      console.log("Folder you're trying to upload does not exist 🔥🔥");
      return cb(new Error('Unable to upload the file'));
    }

    cb(null, path);
  },
  filename: (req, file, cb) => {
    const extension = file.mimetype.split('/')[1];
    const videoId = uuidv4();

    cb(null, `show-video-${videoId}-${Date.now()}.${extension}`);
  },
});

// NEED TO IMPROVE THIS FILTER FUNCTION AND MAKE IT MORE GENERIC FOR FUTURE USE
const multerFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // currently only supports mp4 videos
    if (file.mimetype === 'video/mp4') return cb(null, true);
    else return cb(new Error('Please upload only videos'), false);
  } else if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image')) return cb(null, true);
    else return cb(new Error('Please upload only images'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadVideoFiles = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// CONTROLLERS
export const getAllVideos = catchAsync(async (req, res) => {
  const videos = await Video.find({}).select('-video');

  res.status(200).json({
    status: 'success',
    data: videos,
  });
});

export const uploadVideo = catchAsync(async (req, res) => {
  const { name, description, price, staff } = req.body;
  const organisation = req.org._id;

  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.files.video[0].filename}`;
  const videoThumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.files.thumbnail[0].filename}`;

  const videoObj = {
    name,
    description,
    organisation,
    price,
    staff,
    video: videoUrl,
    thumbnail: videoThumbnailUrl,
  };

  const video = await Video.create(videoObj);

  res.status(201).json({
    status: 'success',
    data: video,
  });
});

export const getOneVideoDetails = catchAsync(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId).select('-video');

  res.status(200).json({
    status: 'success',
    data: video,
  });
});
