import Papa from 'papaparse';

export interface CaseData {
  id?: string;
  location?: string;
  coords?: string;
  amount?: number;
  status?: string;
  station?: string;
  timestamp?: string;
  accountName?: string;
  accountNumber?: string;
  bank?: string;
  reportLink?: string;
  result?: string;
  arrestStatus?: string;
  type: 'atm' | 'branch';
  raw?: any;
}

const ATM_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1knflpfo9uTOBAcKwe8k2cthBj-wV35TIWqCnfMqyZcA/export?format=csv&gid=0';
const BRANCH_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1knflpfo9uTOBAcKwe8k2cthBj-wV35TIWqCnfMqyZcA/export?format=csv&gid=1173111462';

function cleanHeaders(data: any[]) {
  return data.map(item => {
    const newItem: any = {};
    for (const key in item) {
      newItem[key.trim()] = item[key];
    }
    return newItem;
  });
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return response;
      if (response.status >= 500) {
        console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch after ${retries} retries`);
}

async function fetchCSV(url: string, type: 'atm' | 'branch'): Promise<CaseData[]> {
  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const cleanedData = cleanHeaders(results.data);
          const mappedData = cleanedData
            .filter((item: any) => item['Bank Case ID'] || item['Tracking Code'] || item['ชื่อบัญชีที่ถอน'])
            .map((item: any) => ({
              id: item['Bank Case ID'] || item['Tracking Code'],
              location: type === 'atm' ? (item['ชื่อเครื่อง ATM'] || item['เจ้าของเครื่อง']) : (item['ที่อยู่สาขา'] || item['สาขา']),
              coords: `${item['Latitude']}, ${item['Longitude']}`,
              amount: typeof item['จำนวนเงิน'] === 'number' ? item['จำนวนเงิน'] : Number(String(item['จำนวนเงิน'] || 0).replace(/,/g, '')),
              status: item['สถานะติดตามงาน'],
              station: item['สน./สภ.ที่รับผิดชอบ'],
              timestamp: item['วันเวลาโอน'],
              accountName: item['ชื่อบัญชีที่ถอน'],
              accountNumber: item['เลขบัญชีที่ถอน'],
              bank: item['ธนาคารที่ถอน'],
              reportLink: item['link คุมรายงานสืบ'],
              result: item['ผลการสืบสวน'],
              arrestStatus: item['การจับกุม'],
              type: type,
              raw: item
            }));
          resolve(mappedData as CaseData[]);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return [];
  }
}

export async function fetchAllInvestigationData(): Promise<{ atm: CaseData[], branch: CaseData[] }> {
  try {
    const [atmData, branchData] = await Promise.all([
      fetchCSV(ATM_SHEET_URL, 'atm'),
      fetchCSV(BRANCH_SHEET_URL, 'branch')
    ]);
    return { atm: atmData, branch: branchData };
  } catch (error) {
    console.error("Critical error in fetchAllInvestigationData:", error);
    return { atm: [], branch: [] };
  }
}
