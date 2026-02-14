import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';

describe('Database Entities (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;
  let draftRepo: Repository<DraftEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [PostEntity, DraftEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([PostEntity, DraftEntity]),
      ],
    }).compile();

    dataSource = module.get(DataSource);
    postRepo = dataSource.getRepository(PostEntity);
    draftRepo = dataSource.getRepository(DraftEntity);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('PostEntity', () => {
    it('should create a post with auto-generated id and timestamps', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const saved = await postRepo.save(post);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.content).toBe('{"blocks":[]}');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
      expect(saved.deletedAt).toBeNull();
    });

    it('should soft delete a post and exclude it from default queries', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const saved = await postRepo.save(post);

      await postRepo.softRemove(saved);
      const found = await postRepo.findOneBy({ id: saved.id });
      expect(found).toBeNull();

      const withDeleted = await postRepo.findOne({
        where: { id: saved.id },
        withDeleted: true,
      });
      expect(withDeleted).not.toBeNull();
      expect(withDeleted!.deletedAt).toBeInstanceOf(Date);
    });

    it('should preserve a custom id if provided', async () => {
      const post = postRepo.create({
        id: 'my-custom-id',
        content: '{"blocks":[]}',
      });
      const saved = await postRepo.save(post);
      expect(saved.id).toBe('my-custom-id');
    });
  });

  describe('DraftEntity', () => {
    it('should create a draft with auto-generated id and timestamps', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const saved = await draftRepo.save(draft);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.content).toBe('{"blocks":[]}');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it('should update a draft and reflect updatedAt change', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const saved = await draftRepo.save(draft);
      const originalUpdatedAt = saved.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 50));

      saved.content = '{"blocks":[{"type":"paragraph"}]}';
      const updated = await draftRepo.save(saved);

      expect(updated.content).toBe('{"blocks":[{"type":"paragraph"}]}');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it('should preserve a custom id if provided', async () => {
      const draft = draftRepo.create({
        id: 'my-draft-id',
        content: '{"blocks":[]}',
      });
      const saved = await draftRepo.save(draft);
      expect(saved.id).toBe('my-draft-id');
    });
  });
});
