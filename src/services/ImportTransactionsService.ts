import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface transactionCSV{
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(file: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);
    const contactsRead = fs.createReadStream(file);

    // Linha para começar pegar os dados
    const parses = csvParse({ from_line: 2 });

    const parseCSV = contactsRead.pipe(parses);

    const transactions: transactionCSV[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async lineTransaction => {
      const [ title, type, value, category ] = lineTransaction.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value ){
        throw new AppError('Error to import CSV transactions.')
      }
      
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where:{
        title: In(categories),
      }
    });

    const existentTitleCategories = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
    .filter(category => !existentTitleCategories.includes(category))
    .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );  

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        )
      })),
    );
    console.log(createdTransactions);
    await transactionRepository.save(createdTransactions);
 
    await fs.promises.unlink(file);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
