import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CTAContainer, HomeContainer } from "@/styles/home";
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from 'axios';

import { PublicKey } from "@solana/web3.js";
import {
  FindNftsByOwnerOutput,
  Metaplex,
  Nft,
  NftWithToken,
  Pda,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import { LENGTH_SIZE } from "@solana/spl-token";

export default function Home() {
  const [userTokens, setUserTokens] = useState<
    null | (Nft | Sft | SftWithToken | NftWithToken)[]
  >(null);
  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    (async () => {
      if (wallet && wallet.publicKey) {
        const metaplex = new Metaplex(connection);
        const allTokenAccountByOwner = await metaplex
          .nfts()
          //.findByMint({ input: wallet.publicKey })
          .findAllByOwner({ owner: wallet.publicKey });
          console.log(allTokenAccountByOwner)

        // FILTER BY COLLECTION
        
        //const collectionId = new PublicKey('Bg86zLnyza3WzMkvYZu8UcE2dTixt91stbEpNxk8KB6C')
        //const collectionId = new PublicKey( 'CWfKGQdFb1XViqDmCMbzHTK1y7xBdtzC9Tz5R1LAvX4x' )
        const collectionId = new PublicKey( 'BuLg2GB7EaaEnR12xfqpKnG9teMyqHg1dW1k27c56tpP' )
        
        const filteredValue = allTokenAccountByOwner.filter(item => item.collection?.address.toString() === collectionId.toString())
        //const filteredValue = allTokenAccountByOwner.filter(item => item.address.toString() === keyId.toString())

        console.log(filteredValue)

        if(filteredValue.length > 0) {
          console.log("open")
        }
        const data = await Promise.all(
          filteredValue.map(
            async (item) =>
              await metaplex
                .nfts()
                .findByMint({ mintAddress: item.mintAddress })
          )
        );
        console.log("data", data);

        setUserTokens(data);
      }
    })();
  }, [wallet]);

  const RenderTokens = () => {
    return (
      <div>
        {userTokens!.map((value, key) => (
          <div key={key}>
            <Image src={value.json?.image!} alt="" width={300} height={300} />
          </div>
        ))}
      </div>
    );
  };
  
  // const PingComponent: React.FC = () => {
  //   const [pingResponse, setPingResponse] = useState<string>('');
  
  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         const response = await axios.get('/api/ping');
  //         setPingResponse(response.data);
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     };
  
  //     fetchData();
  //   }, []);
  
  //   return (
  //     <div>
  //       <h1>Ping Response:</h1>
  //       <p>{pingResponse}</p>
  //     </div>
  //   );
  // };

  return (
    <><HomeContainer>
      <CTAContainer>{userTokens && <RenderTokens />}</CTAContainer>
    </HomeContainer></>

    
  );
}
