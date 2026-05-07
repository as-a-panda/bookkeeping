import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// List with filtering and pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  const {
    type, categoryId, accountId, tagId,
    startDate, endDate,
    page = '1', pageSize = '20',
  } = req.query as Record<string, string>;

  const where: Prisma.TransactionWhereInput = { userId: req.userId };

  if (type) where.type = type;
  if (categoryId) where.categoryId = Number(categoryId);
  if (accountId) where.accountId = Number(accountId);
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (tagId) {
    where.tags = { some: { tagId: Number(tagId) } };
  }

  const pageNum = Math.max(1, Number(page));
  const size = Math.min(100, Math.max(1, Number(pageSize)));

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        tags: { include: { tag: true } },
        billSplit: true,
      },
      orderBy: { date: 'desc' },
      skip: (pageNum - 1) * size,
      take: size,
    }),
    prisma.transaction.count({ where }),
  ]);

  const data = transactions.map((t) => ({
    ...t,
    tags: t.tags.map((tt) => tt.tag),
  }));

  res.json({
    data,
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
});

// Get single transaction
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: {
      account: true,
      category: true,
      tags: { include: { tag: true } },
      billSplit: true,
    },
  });
  if (!transaction) return res.status(404).json({ error: '交易记录不存在' });

  res.json({
    ...transaction,
    tags: transaction.tags.map((tt) => tt.tag),
  });
});

// Create
router.post('/', async (req: AuthRequest, res: Response) => {
  const { accountId, categoryId, type, amount, description, date, note, tagIds } = req.body;
  if (!accountId || !categoryId || !type || amount === undefined || !date) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      accountId,
      categoryId,
      type,
      amount: Number(amount),
      description,
      note,
      date: new Date(date),
      tags: tagIds?.length
        ? { create: tagIds.map((tagId: number) => ({ tagId })) }
        : undefined,
    },
    include: { account: true, category: true, tags: { include: { tag: true } } },
  });

  // Update account balance
  await updateBalance(req.userId!, accountId);

  res.status(201).json({
    ...transaction,
    tags: transaction.tags.map((tt) => tt.tag),
  });
});

// Update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: '交易记录不存在' });

  const { tagIds, accountId, ...data } = req.body;

  const transaction = await prisma.transaction.update({
    where: { id: Number(id) },
    data: {
      ...data,
      ...(data.date ? { date: new Date(data.date) } : {}),
      tags: tagIds
        ? {
            deleteMany: {},
            create: tagIds.map((tagId: number) => ({ tagId })),
          }
        : undefined,
    },
    include: { account: true, category: true, tags: { include: { tag: true } } },
  });

  // Update balances for old and new accounts
  await updateBalance(req.userId!, existing.accountId);
  if (accountId && accountId !== existing.accountId) {
    await updateBalance(req.userId!, accountId);
  }

  res.json({
    ...transaction,
    tags: transaction.tags.map((tt) => tt.tag),
  });
});

// Delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!transaction) return res.status(404).json({ error: '交易记录不存在' });

  await prisma.transaction.delete({ where: { id: Number(req.params.id) } });
  await updateBalance(req.userId!, transaction.accountId);

  res.json({ message: '删除成功' });
});

// Stats - Summary
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const where: Prisma.TransactionWhereInput = { userId: req.userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const transactions = await prisma.transaction.findMany({ where });
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    incomeCount: transactions.filter((t) => t.type === 'INCOME').length,
    expenseCount: transactions.filter((t) => t.type === 'EXPENSE').length,
  });
});

// Stats - By category
router.get('/stats/by-category', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, type } = req.query as Record<string, string>;
  const where: Prisma.TransactionWhereInput = { userId: req.userId };
  if (type) where.type = type;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
  });

  const grouped = new Map<number, { name: string; type: string; total: number }>();
  let grandTotal = 0;

  for (const t of transactions) {
    const existing = grouped.get(t.categoryId) || {
      name: t.category.name,
      type: t.category.type,
      total: 0,
    };
    existing.total += t.amount;
    grandTotal += t.amount;
    grouped.set(t.categoryId, existing);
  }

  const result = Array.from(grouped.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: data.name,
    categoryType: data.type,
    total: data.total,
    percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 10000) / 100 : 0,
  }));

  res.json(result);
});

// Stats - By month
router.get('/stats/by-month', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const where: Prisma.TransactionWhereInput = { userId: req.userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const transactions = await prisma.transaction.findMany({ where });

  const monthly = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const month = t.date.toISOString().slice(0, 7);
    const entry = monthly.get(month) || { income: 0, expense: 0 };
    if (t.type === 'INCOME') entry.income += t.amount;
    else if (t.type === 'EXPENSE') entry.expense += t.amount;
    monthly.set(month, entry);
  }

  const result = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

  res.json(result);
});

async function updateBalance(userId: number, accountId: number) {
  const aggregation = await prisma.transaction.aggregate({
    where: { userId, accountId },
    _sum: { amount: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId, accountId },
    select: { type: true, amount: true },
  });

  const balance = transactions.reduce((acc, t) => {
    if (t.type === 'INCOME') return acc + t.amount;
    if (t.type === 'EXPENSE') return acc - t.amount;
    return acc;
  }, 0);

  await prisma.account.update({
    where: { id: accountId },
    data: { balance },
  });
}

export default router;
