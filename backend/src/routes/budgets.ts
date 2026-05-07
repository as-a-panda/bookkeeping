import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(budgets);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { categoryId, amount, period, startDate, endDate } = req.body;
  if (!amount || !period || !startDate) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const budget = await prisma.budget.create({
    data: {
      userId: req.userId!,
      categoryId: categoryId || null,
      amount: Number(amount),
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
    include: { category: true },
  });
  res.status(201).json(budget);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const budget = await prisma.budget.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!budget) return res.status(404).json({ error: '预算不存在' });

  const data: any = { ...req.body };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const updated = await prisma.budget.update({
    where: { id: Number(id) },
    data,
    include: { category: true },
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const budget = await prisma.budget.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!budget) return res.status(404).json({ error: '预算不存在' });

  await prisma.budget.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
});

export default router;
