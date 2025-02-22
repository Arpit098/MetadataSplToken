import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import bs58 from "bs58";

// Function to mint tokens to your wallet
async function mintTokens(secretKeyBase58, mintPublicKey, amountToMint) {
  console.log("Starting token minting process...");

  // Decode base58 secret key and create keypair
  const secretKey = bs58.decode(secretKeyBase58);
  const myKeypair = web3.Keypair.fromSecretKey(secretKey);

  // Connection to devnet
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Convert mint address to PublicKey
  const mint = new web3.PublicKey(mintPublicKey);

  // Step 1: Verify mint authority
  const mintInfo = await splToken.getMint(connection, mint, "confirmed");
  if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(myKeypair.publicKey)) {
    throw new Error("Your keypair is not the mint authority for this mint");
  }
  console.log("Mint authority verified. Decimals:", mintInfo.decimals);

  // Step 2: Create or get the Associated Token Account (ATA) for your wallet
  const recipientATA = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    myKeypair,
    mint,
    myKeypair.publicKey
  );
  console.log("Recipient ATA:", recipientATA.address.toBase58());

  // Step 3: Mint tokens to the ATA
  const adjustedAmount = amountToMint * 10 ** mintInfo.decimals; // Adjust for decimals
  const mintToTx = new web3.Transaction().add(
    splToken.createMintToInstruction(
      mint,
      recipientATA.address,
      myKeypair.publicKey, // Mint authority
      adjustedAmount,
      [], // No multi-signers
      splToken.TOKEN_PROGRAM_ID
    )
  );

  const mintToTxid = await web3.sendAndConfirmTransaction(connection, mintToTx, [myKeypair], {
    commitment: "confirmed",
  });
  console.log("Tokens minted. Transaction ID:", mintToTxid);
  console.log(`Minted ${amountToMint} tokens to ${recipientATA.address.toBase58()}`);
}

// Example usage (call this after your main function)
async function runMinting() {
  const secretKeyBase58 = "5U1WiuTWynwm95qZSmoxTJA3VJ3gPbuCyLP153GE1Xfv2vJSpB8A6ixYafXV24fqwzeQKdGRvDehCt2KjhWfNaVW";
  const mintPublicKey = "5quRf7PAiVWJPxFgnyvoz8hgVTM3i1vTAehySMcgNSQ";
  const amountToMint = 1000; // Number of tokens to mint (e.g., 1000 tokens)

  try {
    await mintTokens(secretKeyBase58, mintPublicKey, amountToMint);
  } catch (err) {
    console.error("Error during minting:", err);
  }
}

runMinting();