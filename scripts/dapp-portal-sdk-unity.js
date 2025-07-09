window.initalizeSDK = async function(liffId, clientId, chainId) 
{
    try 
    {
        console.log("call initalizeSDK(%s, %s, %d)", liffId, clientId, chainId);

        const host = window.location.hostname;
        if(host.includes("liff.line.me"))
        {
            window.liff = await liff.init({
                liffId : liffId
            });
    
            if(!window.liff.isLoggedIn()) {
                window.liff.login();
            };
        }

        window.sdk = await DappPortalSDK.init
        (
            {
                clientId : clientId,
                chainId : '1001'
            }
        );

        console.log("SDK initalized");
        return true;
    } 
    catch(error) 
    {
        console.log("SDK init error : ", error);
        return false;
    }
}

function ResponseSuccessToUnity(requestId, responseText)
{
    const response = JSON.stringify
    (
        {
            requestId : requestId,
            status : 200,
            responseText:  responseText
        }
    )
    window.unityInstance.SendMessage("DappPotalSDKHandler", "OnDappPortalSDKResponseSuccess", response);
}

function ResponseFailToUnity(requestId, responseText)
{
    const response = JSON.stringify
    (
        {
            requestId : requestId,
            status : 2000,
            responseText:  responseText
        }
    )
    window.unityInstance.SendMessage("DappPotalSDKHandler", "OnDappPortalSDKResponseFailed", response);
}

window.ConnectWallet = async function(requestId, liffId, clientId, chainId) 
{
    console.log("call ConnectWallet!!(%s, %s, %s, %d)", requestId, liffId, clientId, chainId);

    try
    {
        if (!window.sdk) 
        {
            console.log("sdk is null");
            const initialized = await window.initalizeSDK(liffId, clientId, chainId);
            if (!initialized) 
            {
                console.log("initialized is false!!!");
                ResponseFailToUnity(requestId, "ConnectWallet[SDK initalize error]");
                return null;
            }
            else
                console.log("initialized is true!!!");
        }
        else
            console.log("sdk is not null!!!");

        const provider = window.sdk.getWalletProvider();
        const accounts = await provider.request({ method: 'kaia_requestAccounts' });

        if (accounts && accounts.length > 0) 
            ResponseSuccessToUnity(requestId, accounts[0]);
        else
            ResponseFailToUnity(requestId,  "ConnectWallet[Account is empty]");
        
    }
    catch(error)
    {
        const errorMessage = 'ConnectWallet[${error.message}]';
        ResponseFailToUnity(requestId, errorMessage);
    }
}

window.Signature = async function(requestId, accountAddress, loginMessage) 
{
    console.log("call Signature!!(%s, %s)", accountAddress, loginMessage);
    
    try
    {
        const provider = window.sdk.getWalletProvider();
        const signature = await provider.request({method: 'personal_sign', params: [loginMessage, accountAddress]});
        if(signature && signature.length > 0)
        {
            const walletType = await provider.getWalletType();
            const responseText = JSON.stringify
            (
                {
                    signature : signature,
                    walletType :  walletType
                }
            )

            ResponseSuccessToUnity(requestId, responseText);
        }
        else
            ResponseFailToUnity(requestId, "Signature[signature is empty]");
    }
    catch(error)
    {
        const errorMessage = 'Signature[${error.message}]';
        ResponseFailToUnity(requestId, errorMessage);
    }
}

window.DisconnectWallet = async function(requestId, liffId, clientId, chainId)
{
    console.log("call Disconnect!!");

    try
    {
        if (!window.sdk) 
        {
            console.log("sdk is null");
            const initialized = await window.initalizeSDK(liffId, clientId, chainId);
            if (!initialized) 
            {
                console.log("initialized is false!!!");
                ResponseFailToUnity(requestId, "SDK initalize error");
                return null;
            }
            else
                console.log("initialized is true!!!");
        }
        else
            console.log("sdk is not null!!!");

        const provider = window.sdk.getWalletProvider();
        await provider.disconnectWallet()
        window.location.reload();

        ResponseSuccessToUnity(requestId, "DisconnectSuccess");
    }
    catch(error)
    {
        const errorMessage = 'DisconnectWallet[${error.message}]';
        ResponseFailToUnity(requestId, errorMessage);
    }
}
