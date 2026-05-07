import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.userId },
    orderBy: { id: 'asc' },
  });
  res.json(tags);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: '标签名称不能为空' });

  const existing = await prisma.tag.findFirst({
    where: { userId: req.userId, name },
  });
  if (existing) return res.status(409).json({ error: '标签已存在' });

  const tag = await prisma.tag.create({
    data: { userId: req.userId!, name, color },
  });
  res.status(201).json(tag);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tag = await prisma.tag.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!tag) return res.status(404).json({ error: '标签不存在' });

  await prisma.tag.delete({ where: { id: Number(id) } });
  res.json({ message: '删除成功' });
});

export default router;
