import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import transactionRoutes from './routes/transactions';
import recurringRoutes from './routes/recurring';
import budgetRoutes from './routes/budgets';
import billSplitRoutes from './routes/billSplits';
import exportRoutes from './routes/export';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/bill-splits', billSplitRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
