import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: req.userId }, { userId: null }] },
    orderBy: { id: 'asc' },
  });
  res.json(categories);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, type, icon, parentId } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: '分类名称和类型不能为空' });
  }
  const category = await prisma.category.create({
    data: { userId: req.userId!, name, type, icon, parentId: parentId || null },
  });
  res.status(201).json(category);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const category = await prisma.category.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!category) return res.status(404).json({ error: '分类不存在' });

  const updated = await prisma.category.update({
    where: { id: Number(id) },
    data: req.body,
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const category = await prisma.category.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!category) return res.status(404).json({ error: '分类不存在' });

  await prisma.category.delete({ where: { id: Number(id) } });
  res.json({ message: '删除成功' });
});

export default router;
