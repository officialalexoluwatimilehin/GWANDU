const axios = require("axios");
const crypto = require("crypto");

const HTTP = axios.create({
    timeout: 20000
});

const EVM_TRANSFER_TOPIC =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a3e5f7c2";

const EVM = {
    ERC20: {
        rpc: "https://cloudflare-eth.com",
        contract: (
            process.env.USDT_CONTRACT_ERC20 ||
            "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        )
    },

    BEP20: {
        rpc: "https://bsc-dataseed.binance.org",
        contract: (
            process.env.USDT_CONTRACT_BEP20 ||
            "0x55d398326f99059fF775485246999027B3197955"
        )
    },

    ARBITRUM: {
        rpc: "https://arb1.arbitrum.io/rpc",
        contract: (
            process.env.USDT_CONTRACT_ARBITRUM ||
            "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
        )
    }
};

async function rpc(url, method, params = []) {

    const response = await HTTP.post(url, {
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
    });

    if (response.data.error) {
        throw new Error(
            response.data.error.message ||
            "Blockchain RPC error"
        );
    }

    return response.data.result;
}

function hexToNumber(hex) {
    if (!hex) return 0;
    return Number(BigInt(hex));
}

function normalizeAddress(address) {
    return String(address || "").toLowerCase();
}

/* =========================================================
   BITCOIN
========================================================= */

async function verifyBTC({
    txHash,
    destinationWallet,
    requestedUsd
}) {

    let btcUsdRate;
    let tx;
    let confirmed = false;
    let blockHeight = null;

    // ========================================================
    // BTC PRICE: Mempool first, CoinGecko fallback
    // ========================================================

    try {

        const priceResponse = await HTTP.get(
            "https://mempool.space/api/v1/prices",
            { timeout: 10000 }
        );

        btcUsdRate = Number(priceResponse.data.USD);

    } catch (err) {

        console.log(
            "Mempool BTC price unavailable, using CoinGecko fallback:",
            err.message
        );

        try {

            const priceResponse = await HTTP.get(
                "https://api.coingecko.com/api/v3/simple/price",
                {
                    params: {
                        ids: "bitcoin",
                        vs_currencies: "usd"
                    },
                    timeout: 15000
                }
            );

            btcUsdRate =
                Number(priceResponse.data.bitcoin.usd);

        } catch (priceErr) {

            throw new Error(
                "Unable to obtain current Bitcoin price"
            );
        }
    }

    if (!btcUsdRate || btcUsdRate <= 0) {
        throw new Error(
            "Unable to obtain current Bitcoin price"
        );
    }

    const requiredBTC =
        requestedUsd / btcUsdRate;

    // ========================================================
    // TRANSACTION: Mempool first, Blockstream fallback
    // ========================================================

    try {

        const txResponse = await HTTP.get(
            `https://mempool.space/api/tx/${txHash}`,
            { timeout: 10000 }
        );

        tx = txResponse.data;

    } catch (err) {

        console.log(
            "Mempool BTC transaction API unavailable, using Blockstream fallback:",
            err.message
        );

        try {

            const txResponse = await HTTP.get(
                `https://blockstream.info/api/tx/${txHash}`,
                { timeout: 15000 }
            );

            tx = txResponse.data;

        } catch (txErr) {

            throw new Error(
                "Bitcoin transaction could not be found or blockchain API is temporarily unavailable"
            );
        }
    }

    if (!tx || !tx.txid) {
        throw new Error(
            "Bitcoin transaction not found"
        );
    }

    // ========================================================
    // CALCULATE BTC SENT TO GWANDU WALLET
    // ========================================================

    let receivedSatoshis = 0;

    for (const output of tx.vout || []) {

        const address =
            output.scriptpubkey_address ||
            output.scriptpubkey_address;

        if (
            address &&
            address === destinationWallet
        ) {

            receivedSatoshis +=
                Number(output.value || 0);
        }
    }

    const receivedBTC =
        receivedSatoshis / 100000000;

    if (receivedBTC <= 0) {

        throw new Error(
            "This Bitcoin transaction did not send BTC to the GWANDU wallet"
        );
    }

    // ========================================================
    // CONFIRMATION STATUS
    // ========================================================

    try {

        const statusResponse = await HTTP.get(
            `https://mempool.space/api/tx/${txHash}/status`,
            { timeout: 10000 }
        );

        const status = statusResponse.data;

        confirmed = Boolean(status.confirmed);
        blockHeight = Number(status.block_height);

    } catch (err) {

        console.log(
            "Mempool BTC status unavailable, using Blockstream fallback:",
            err.message
        );

        try {

            confirmed =
                Boolean(tx.status && tx.status.confirmed);

            blockHeight =
                Number(
                    tx.status &&
                    tx.status.block_height
                );

        } catch (statusErr) {

            throw new Error(
                "Unable to determine Bitcoin confirmation status"
            );
        }
    }

    if (!confirmed) {

        throw new Error(
            "Bitcoin transaction is not confirmed yet"
        );
    }

    // ========================================================
    // GET CURRENT BLOCK HEIGHT
    // ========================================================

    let tipHeight;

    try {

        const tipResponse = await HTTP.get(
            "https://mempool.space/api/blocks/tip/height",
            { timeout: 10000 }
        );

        tipHeight =
            Number(tipResponse.data);

    } catch (err) {

        console.log(
            "Mempool BTC tip unavailable, using Blockstream fallback:",
            err.message
        );

        try {

            const tipResponse = await HTTP.get(
                "https://blockstream.info/api/blocks/tip/height",
                { timeout: 15000 }
            );

            tipHeight =
                Number(tipResponse.data);

        } catch (tipErr) {

            throw new Error(
                "Unable to determine current Bitcoin block height"
            );
        }
    }

    const confirmations =
        Math.max(
            0,
            tipHeight -
            blockHeight +
            1
        );

    const minimum =
        Number(
            process.env.BTC_MIN_CONFIRMATIONS || 1
        );

    if (confirmations < minimum) {

        throw new Error(
            `Bitcoin transaction needs at least ${minimum} confirmation(s)`
        );
    }

    // ========================================================
    // VERIFY PAYMENT VALUE
    // ========================================================

    if (receivedBTC + 0.00000001 < requiredBTC) {

        const receivedUsd =
            receivedBTC * btcUsdRate;

        throw new Error(
            `Insufficient BTC. Required ${requiredBTC.toFixed(8)} BTC ($${requestedUsd.toFixed(2)}), received ${receivedBTC.toFixed(8)} BTC ($${receivedUsd.toFixed(2)})`
        );
    }

    return {
        verified: true,
        asset: "BTC",
        cryptoAmount: receivedBTC,
        requiredCryptoAmount: requiredBTC,
        usdValue: receivedBTC * btcUsdRate,
        priceUsd: btcUsdRate,
        confirmations,
        destinationWallet
    };
}

/* =========================================================
   EVM / ERC20 / BEP20 / ARBITRUM USDT
========================================================= */

async function verifyEVM({
    network,
    txHash,
    destinationWallet,
    requestedUsd
}) {

    const chain = EVM[network];

    if (!chain) {
        throw new Error(
            `EVM network ${network} is not configured`
        );
    }

    const tx = await rpc(
        chain.rpc,
        "eth_getTransactionByHash",
        [txHash]
    );

    if (!tx) {
        throw new Error(
            `${network} transaction not found`
        );
    }

    const receipt = await rpc(
        chain.rpc,
        "eth_getTransactionReceipt",
        [txHash]
    );

    if (!receipt) {
        throw new Error(
            `${network} transaction is not confirmed yet`
        );
    }

    if (receipt.status !== "0x1") {
        throw new Error(
            `${network} transaction failed on-chain`
        );
    }

    const latestBlockHex =
        await rpc(
            chain.rpc,
            "eth_blockNumber"
        );

    const latestBlock =
        hexToNumber(latestBlockHex);

    const txBlock =
        hexToNumber(receipt.blockNumber);

    const confirmations =
        Math.max(
            0,
            latestBlock - txBlock + 1
        );

    const minimum =
        Number(
            process.env.EVM_MIN_CONFIRMATIONS || 1
        );

    if (confirmations < minimum) {
        throw new Error(
            `${network} transaction needs at least ${minimum} confirmation(s)`
        );
    }

    let receivedUnits = 0n;

    const wantedContract =
        normalizeAddress(chain.contract);

    const wantedDestination =
        normalizeAddress(destinationWallet);

    for (const log of receipt.logs || []) {

        if (
            normalizeAddress(log.address) !==
            wantedContract
        ) {
            continue;
        }

        if (
            !log.topics ||
            log.topics.length < 3
        ) {
            continue;
        }

        if (
            normalizeAddress(log.topics[0]) !==
            normalizeAddress(EVM_TRANSFER_TOPIC)
        ) {
            continue;
        }

        const toTopic =
            "0x" +
            log.topics[2]
                .replace(/^0x/, "")
                .slice(-40);

        if (
            normalizeAddress(toTopic) !==
            wantedDestination
        ) {
            continue;
        }

        receivedUnits +=
            BigInt(log.data);
    }

    if (receivedUnits <= 0n) {
        throw new Error(
            `${network} transaction did not send USDT to the GWANDU wallet`
        );
    }

    /*
     * USDT uses 6 decimals on Ethereum, BNB Smart Chain
     * and Arbitrum.
     */
    const receivedUSDT =
        Number(receivedUnits) / 1000000;

    /*
     * USDT is treated as approximately USD 1 for
     * deposit settlement.
     */
    const requiredUSDT =
        requestedUsd;

    if (receivedUSDT + 0.000001 < requiredUSDT) {

        throw new Error(
            `Insufficient USDT. Required ${requiredUSDT.toFixed(6)} USDT, received ${receivedUSDT.toFixed(6)} USDT`
        );
    }

    return {
        verified: true,
        asset: "USDT",
        cryptoAmount: receivedUSDT,
        requiredCryptoAmount: requiredUSDT,
        usdValue: receivedUSDT,
        priceUsd: 1,
        confirmations,
        destinationWallet,
        tokenContract: chain.contract
    };
}

/* =========================================================
   TRON BASE58
========================================================= */

const BASE58 =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str) {

    let num = 0n;

    for (const char of str) {

        const index =
            BASE58.indexOf(char);

        if (index < 0) {
            throw new Error(
                "Invalid TRON address"
            );
        }

        num =
            num * 58n +
            BigInt(index);
    }

    let hex =
        num.toString(16);

    if (hex.length % 2) {
        hex = "0" + hex;
    }

    let bytes =
        Buffer.from(hex, "hex");

    let leading = 0;

    for (
        let i = 0;
        i < str.length &&
        str[i] === "1";
        i++
    ) {
        leading++;
    }

    if (leading) {
        bytes = Buffer.concat([
            Buffer.alloc(leading),
            bytes
        ]);
    }

    return bytes;
}

function tronAddressToHex(address) {

    const decoded =
        base58Decode(address);

    if (decoded.length < 25) {
        throw new Error(
            "Invalid TRON address"
        );
    }

    return decoded
        .subarray(0, 21)
        .toString("hex")
        .toLowerCase();
}

/* =========================================================
   TRC20 USDT
========================================================= */

async function verifyTRC20({
    txHash,
    destinationWallet,
    requestedUsd
}) {

    const headers = {};

    if (process.env.TRON_PRO_API_KEY) {
        headers["TRON-PRO-API-KEY"] =
            process.env.TRON_PRO_API_KEY;
    }

    const base =
        "https://api.trongrid.io";

    const txResponse =
        await HTTP.post(
            `${base}/walletsolidity/gettransactionbyid`,
            {
                value: txHash
            },
            { headers }
        );

    const tx = txResponse.data;

    if (
        !tx ||
        !tx.txID
    ) {
        throw new Error(
            "TRON transaction not found or not solidified"
        );
    }

    const infoResponse =
        await HTTP.post(
            `${base}/walletsolidity/gettransactioninfobyid`,
            {
                value: txHash
            },
            { headers }
        );

    const info = infoResponse.data;

    if (
        !info ||
        !info.id
    ) {
        throw new Error(
            "TRON transaction receipt is not available yet"
        );
    }

    if (
        info.receipt &&
        info.receipt.result &&
        info.receipt.result !== "SUCCESS"
    ) {
        throw new Error(
            `TRON transaction failed: ${info.receipt.result}`
        );
    }

    const destinationHex =
        tronAddressToHex(
            destinationWallet
        );

    const usdtContract =
        (
            process.env.USDT_CONTRACT_TRC20 ||
            "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        ).toLowerCase();

    let receivedUnits = 0n;

    for (const log of info.log || []) {

        if (
            String(log.address || "")
                .toLowerCase() !==
            usdtContract
                .replace(/^0x/, "")
                .toLowerCase()
        ) {
            continue;
        }

        const topics =
            log.topics || [];

        if (topics.length < 3) {
            continue;
        }

        if (
            topics[0].toLowerCase() !==
            EVM_TRANSFER_TOPIC
                .replace(/^0x/, "")
                .toLowerCase()
        ) {
            continue;
        }

        const to =
            topics[2]
                .replace(/^0x/, "")
                .slice(-40)
                .toLowerCase();

        if (
            to !==
            destinationHex
                .replace(/^0x/, "")
                .slice(-40)
                .toLowerCase()
        ) {
            continue;
        }

        const data =
            log.data ||
            "0";

        receivedUnits +=
            BigInt(
                data.startsWith("0x")
                    ? data
                    : "0x" + data
            );
    }

    if (receivedUnits <= 0n) {
        throw new Error(
            "TRON transaction did not send USDT to the GWANDU wallet"
        );
    }

    const receivedUSDT =
        Number(receivedUnits) / 1000000;

    if (
        receivedUSDT + 0.000001 <
        requestedUsd
    ) {
        throw new Error(
            `Insufficient USDT. Required ${requestedUsd.toFixed(6)} USDT, received ${receivedUSDT.toFixed(6)} USDT`
        );
    }

    return {
        verified: true,
        asset: "USDT",
        cryptoAmount: receivedUSDT,
        requiredCryptoAmount: requestedUsd,
        usdValue: receivedUSDT,
        priceUsd: 1,
        confirmations: 1,
        destinationWallet,
        tokenContract:
            process.env.USDT_CONTRACT_TRC20 ||
            "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    };
}

/* =========================================================
   SOLANA
========================================================= */

async function verifySOL({
    txHash,
    destinationWallet,
    requestedUsd
}) {

    const tx =
        await rpc(
            "https://api.mainnet-beta.solana.com",
            "getTransaction",
            [
                txHash,
                {
                    encoding: "jsonParsed",
                    commitment: "finalized",
                    maxSupportedTransactionVersion: 0
                }
            ]
        );

    if (!tx) {
        throw new Error(
            "Solana transaction not found or not finalized"
        );
    }

    if (
        tx.meta &&
        tx.meta.err
    ) {
        throw new Error(
            "Solana transaction failed on-chain"
        );
    }

    const accountKeys =
        tx.transaction &&
        tx.transaction.message &&
        tx.transaction.message.accountKeys
            ? tx.transaction.message.accountKeys
            : [];

    let receivedLamports = 0;

    for (
        let i = 0;
        i < accountKeys.length;
        i++
    ) {

        const account =
            typeof accountKeys[i] === "string"
                ? accountKeys[i]
                : accountKeys[i].pubkey;

        if (
            account === destinationWallet
        ) {

            const before =
                Number(
                    tx.meta.preBalances[i] || 0
                );

            const after =
                Number(
                    tx.meta.postBalances[i] || 0
                );

            const delta =
                after - before;

            if (delta > 0) {
                receivedLamports += delta;
            }
        }
    }

    const receivedSOL =
        receivedLamports / 1000000000;

    if (receivedSOL <= 0) {
        throw new Error(
            "Solana transaction did not send SOL to the GWANDU wallet"
        );
    }

    const priceResponse =
        await HTTP.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: "solana",
                    vs_currencies: "usd"
                }
            }
        );

    const solUsdRate =
        Number(
            priceResponse.data &&
            priceResponse.data.solana &&
            priceResponse.data.solana.usd
        );

    if (!solUsdRate || solUsdRate <= 0) {
        throw new Error(
            "Unable to obtain current SOL price"
        );
    }

    const receivedUsd =
        receivedSOL * solUsdRate;

    const requiredSOL =
        requestedUsd / solUsdRate;

    if (
        receivedSOL + 0.000000001 <
        requiredSOL
    ) {
        throw new Error(
            `Insufficient SOL. Required approximately ${requiredSOL.toFixed(9)} SOL ($${requestedUsd.toFixed(2)}), received ${receivedSOL.toFixed(9)} SOL ($${receivedUsd.toFixed(2)})`
        );
    }

    return {
        verified: true,
        asset: "SOL",
        cryptoAmount: receivedSOL,
        requiredCryptoAmount: requiredSOL,
        usdValue: receivedUsd,
        priceUsd: solUsdRate,
        confirmations: 1,
        destinationWallet
    };
}

/* =========================================================
   TON
========================================================= */

async function verifyTON({
    txHash,
    destinationWallet,
    requestedUsd
}) {

    const headers = {};

    if (process.env.TONCENTER_API_KEY) {
        headers["X-API-Key"] =
            process.env.TONCENTER_API_KEY;
    }

    const response =
        await HTTP.get(
            "https://toncenter.com/api/v2/getTransactions",
            {
                headers,
                params: {
                    address: destinationWallet,
                    limit: 20
                }
            }
        );

    const transactions =
        response.data &&
        response.data.result
            ? response.data.result
            : [];

    const cleanHash =
        txHash
            .replace(/^0x/, "")
            .toLowerCase();

    let matched = null;

    for (const transaction of transactions) {

        const hashes = [
            transaction &&
            transaction.transaction_id &&
            transaction.transaction_id.hash,

            transaction &&
            transaction.in_msg &&
            transaction.in_msg.hash
        ]
            .filter(Boolean)
            .map(x =>
                String(x).toLowerCase()
            );

        if (
            hashes.includes(cleanHash)
        ) {
            matched = transaction;
            break;
        }
    }

    if (!matched) {
        throw new Error(
            "TON transaction was not found in the destination wallet's recent confirmed transactions"
        );
    }

    const incoming =
        matched.in_msg;

    if (!incoming) {
        throw new Error(
            "TON transaction has no incoming payment"
        );
    }

    if (
        incoming.destination &&
        incoming.destination !== destinationWallet
    ) {
        throw new Error(
            "TON transaction destination does not match the GWANDU wallet"
        );
    }

    const nanoTON =
        BigInt(
            incoming.value || "0"
        );

    const receivedTON =
        Number(nanoTON) / 1000000000;

    if (receivedTON <= 0) {
        throw new Error(
            "TON transaction contains no TON payment"
        );
    }

    const priceResponse =
        await HTTP.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: "the-open-network",
                    vs_currencies: "usd"
                }
            }
        );

    const tonUsdRate =
        Number(
            priceResponse.data &&
            priceResponse.data["the-open-network"] &&
            priceResponse.data["the-open-network"].usd
        );

    if (!tonUsdRate || tonUsdRate <= 0) {
        throw new Error(
            "Unable to obtain current TON price"
        );
    }

    const receivedUsd =
        receivedTON * tonUsdRate;

    const requiredTON =
        requestedUsd / tonUsdRate;

    if (
        receivedTON + 0.000000001 <
        requiredTON
    ) {
        throw new Error(
            `Insufficient TON. Required approximately ${requiredTON.toFixed(9)} TON ($${requestedUsd.toFixed(2)}), received ${receivedTON.toFixed(9)} TON ($${receivedUsd.toFixed(2)})`
        );
    }

    return {
        verified: true,
        asset: "TON",
        cryptoAmount: receivedTON,
        requiredCryptoAmount: requiredTON,
        usdValue: receivedUsd,
        priceUsd: tonUsdRate,
        confirmations: 1,
        destinationWallet
    };
}

/* =========================================================
   MAIN
========================================================= */

async function verifyDeposit({
    network,
    txHash,
    destinationWallet,
    requestedUsd
}) {

    if (network === "BTC") {

        return verifyBTC({
            txHash,
            destinationWallet,
            requestedUsd
        });

    }

    if (
        network === "ERC20" ||
        network === "BEP20" ||
        network === "ARBITRUM"
    ) {

        return verifyEVM({
            network,
            txHash,
            destinationWallet,
            requestedUsd
        });

    }

    if (network === "TRC20") {

        return verifyTRC20({
            txHash,
            destinationWallet,
            requestedUsd
        });

    }

    if (network === "SOL") {

        return verifySOL({
            txHash,
            destinationWallet,
            requestedUsd
        });

    }

    if (network === "TON") {

        return verifyTON({
            txHash,
            destinationWallet,
            requestedUsd
        });

    }

    throw new Error(
        `Unsupported deposit network: ${network}`
    );
}

module.exports = {
    verifyDeposit
};
