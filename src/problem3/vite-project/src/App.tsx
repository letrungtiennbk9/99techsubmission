import { useMemo, type PropsWithChildren } from 'react'
import './App.css'

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain; // added blockchain information
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
  blockchain: Blockchain;

}
// Add interface for Prices
interface Prices {
  [currency: string]: number;
}

interface Props extends PropsWithChildren {

}

const useWalletBalances = (): WalletBalance[] => {
  // Mocked wallet balances
  return [
    { currency: 'ETH', amount: 2.5, blockchain: 'Ethereum' },
    { currency: 'OSMO', amount: 1500, blockchain: 'Osmosis' },
    { currency: 'ZIL', amount: 3000, blockchain: 'Zilliqa' },
    { currency: 'NEO', amount: 100, blockchain: 'Neo' },
    { currency: 'ARB', amount: 5, blockchain: 'Arbitrum' },
  ];
}

const usePrices = (): Prices => {
  // Mocked prices
  return {
    'ETH': 3000,
    'OSMO': 10,
    'ZIL': 0.1,
    'NEO': 40,
    'ARB': 20,
  };
}

// rewrite getPriority to this object so that it's O(n) to get the value from key
const priority = {
  'Osmosis': 100,
  'Ethereum': 50,
  'Arbitrum': 30,
  'Zilliqa': 20,
  'Neo': 20,
}
const getPriority = (blockchain: any): number => {
	  switch (blockchain) {
	    case 'Osmosis':
	      return 100
	    case 'Ethereum':
	      return 50
	    case 'Arbitrum':
	      return 30
	    case 'Zilliqa':
	      return 20
	    case 'Neo':
	      return 20
	    default:
	      return -99
	  }
}

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
      const balancePriority = priority[balance.blockchain];

      if (balancePriority === undefined) {
        return false;
      }
      // lhsPriority --> balancePriority
      // balance.amount <= 0 --> balance.amount >= 0
      // combine the two conditions into one if statement
		  if (balancePriority > -99 && balance.amount >= 0) {
		    return true;
		  }

		  return false
		}).sort((lhs: WalletBalance, rhs: WalletBalance) => {
			const leftPriority = priority[lhs.blockchain];  // getPriority --> priority[]
		  const rightPriority = priority[rhs.blockchain];
		  if (leftPriority > rightPriority) {
		    return -1;
		  } else if (rightPriority > leftPriority) {
		    return 1;
		  }
      return 0
    });
  }, [balances]); // remove prices from dependency array because it's not used in the memo

  // Use memo for the formatted balances
  const formattedBalances = useMemo(() => {
    return sortedBalances.map((balance: WalletBalance) => {
      return {
        ...balance,
        formatted: balance.amount.toFixed(2) //For example, 2 decimal places
      }
    });
  }, [sortedBalances]);

  // sortedBalances --> formattedBalances
  const rows = formattedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow 
        // className={classes.row}
        key={`${balance.amount}-${balance.currency}`} // index --> balance.amount + balance.currency: use unique key
        usdValue={usdValue}
        formattedAmount={balance.formatted}
        currency={balance.currency}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}

const WalletRow : React.FC<{
  usdValue: number;
  formattedAmount: string;
  currency: string;
}> = ({usdValue, formattedAmount, currency }) => {
  return (
    <div className="wallet-row">
      <span>Amount: {formattedAmount} </span>
      <span>USD Value: ${usdValue.toFixed(2)} </span>
      <span>Currency: {currency}</span>
    </div>
  )
}
function App() {
  return (
    <>
      <WalletPage />
    </>
  )
}

export default App
