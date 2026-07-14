import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: jest.Mocked<UploadsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: { uploadImage: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(UploadsController);
    service = module.get(UploadsService);
  });

  it('passes the uploaded file to the upload service', async () => {
    const file = { originalname: 'drink.png' } as Express.Multer.File;
    service.uploadImage.mockResolvedValue({
      imageUrl: '/uploads/products/image.png',
    });

    await expect(controller.uploadImage(file)).resolves.toEqual({
      imageUrl: '/uploads/products/image.png',
    });
    expect(service.uploadImage).toHaveBeenCalledWith(file);
  });
});
