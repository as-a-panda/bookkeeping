import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(accounts);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, type, balance, currency } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: '账户名称和类型不能为空' });
  }
  const account = await prisma.account.create({
    data: { userId: req.userId!, name, type, balance: balance || 0, currency: currency || 'CNY' },
  });
  res.status(201).json(account);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const account = await prisma.account.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!account) return res.status(404).json({ error: '账户不存在' });

  const updated = await prisma.account.update({
    where: { id: Number(id) },
    data: req.body,
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const account = await prisma.account.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!account) return res.status(404).json({ error: '账户不存在' });

  await prisma.account.delete({ where: { id: Number(id) } });
  res.json({ message: '删除成功' });
});

export default router;
