import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { validateImageFile } from '../common/validators/image.validator';

/**
 * Contrôleur gérant les téléversements (uploads) de fichiers.
 * Restreint aux utilisateurs authentifiés pour éviter les abus.
 */
@Controller('upload')
export class UploadController {
  /**
   * Traite l'upload d'une image unique.
   * Valide le type MIME, l'extension et le poids du fichier avant stockage sur le disque.
   *
   * @param {Express.Multer.File} file - Le fichier intercepté par Multer.
   * @returns {{ message: string, url: string }} Un objet contenant l'URL relative du fichier stocké.
   * @throws {BadRequestException} Si le fichier est invalide ou manquant.
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const errors = validateImageFile(file.mimetype, file.originalname);
        if (errors.length > 0) {
          return cb(new BadRequestException(errors.join(', ')), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // Limite stricte à 5 Mo
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Aucun fichier fourni ou format non supporté.',
      );
    }

    return {
      message: 'Fichier sauvegardé avec succès.',
      url: `/uploads/${file.filename}`,
    };
  }
}
