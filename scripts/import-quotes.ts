import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface QuoteRow {
  quote: string
  author: string
  category: string
}

function parseCSV(content: string): QuoteRow[] {
  const lines = content.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim())
  const records: QuoteRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    if (values.length >= 3) {
      records.push({
        quote: values[0].replace(/^"|"$/g, ''),
        author: values[1].replace(/^"|"$/g, ''),
        category: values[2].replace(/^"|"$/g, ''),
      })
    }
  }

  return records
}

async function importQuotes() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '..', 'Downloads', 'motivational_quotes.csv'),
      path.join(process.env.HOME || '', 'Downloads', 'motivational_quotes.csv'),
      '/Users/jeffreyjorgensen/Downloads/motivational_quotes.csv',
    ]
    
    let csvPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        csvPath = p
        break
      }
    }
    
    if (!csvPath) {
      throw new Error(`CSV file not found. Tried: ${possiblePaths.join(', ')}`)
    }
    
    console.log(`Reading CSV from: ${csvPath}`)
    const fileContent = fs.readFileSync(csvPath, 'utf-8')
    
    const records = parseCSV(fileContent)

    console.log(`Found ${records.length} quotes to import`)

    // Get the current date
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    let imported = 0
    let skipped = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const quoteDate = new Date(startDate)
      quoteDate.setDate(startDate.getDate() + i)

      try {
        // Check if a message already exists for this date
        const existing = await prisma.motivationalMessage.findUnique({
          where: { date: quoteDate },
        })

        if (existing) {
          console.log(`Skipping ${quoteDate.toISOString().split('T')[0]} - already exists`)
          skipped++
          continue
        }

        await prisma.motivationalMessage.create({
          data: {
            message: record.quote,
            author: record.author || null,
            category: record.category || null,
            date: quoteDate,
            active: true,
          },
        })

        imported++
        console.log(`Imported: "${record.quote.substring(0, 50)}..." for ${quoteDate.toISOString().split('T')[0]}`)
      } catch (error: any) {
        console.error(`Error importing quote ${i + 1}:`, error.message)
        skipped++
      }
    }

    console.log(`\nImport complete!`)
    console.log(`- Imported: ${imported}`)
    console.log(`- Skipped: ${skipped}`)
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importQuotes()
