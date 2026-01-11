import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

// Ensure the directory exists
// const uploadDir = path.join(__dirname, '../../public/uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

export const uploadImage = async (req: AuthRequest, res: Response) => {
  console.log("File uploading is in work!!")
  // try {
  //   if (!req.file) {
  //     return res.status(400).json({ message: 'No file uploaded' });
  //   }

  //   // Create a unique filename
  //   // This prevents browser caching issues when they update their picture.
  //   const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    
  //   // Define the path on your hard drive
  //   const outputPath = path.join(uploadDir, filename);

  //   // Process with Sharp
  //   await sharp(req.file.buffer)
  //     .resize(500, 500, { 
  //       fit: 'cover',
  //       position: 'center' 
  //     })
  //     .toFormat('jpeg')
  //     .jpeg({ quality: 80 })
  //     .toFile(outputPath);

  //   // Return the URL
  //   // The frontend will take this string and send it to 'updateProfile'
  //   res.status(200).json({
  //     url: `/uploads/${filename}`,
  //     message: 'Image uploaded successfully'
  //   });

  // } catch (error) {
  //   console.error('Upload Error:', error);
  //   res.status(500).json({ message: 'Server error processing image' });
  // }
};