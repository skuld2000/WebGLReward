(function() {

    function getInitialLineAdConfig() {
        return {
            adInfo: {
                zoneId: null,
                publisherId: null,
            },
            adParams: {
                line: {
                    type: '',
                    liffId: '',
                    prototype: null
                },
                wallet: {
                    type: '',
                    provider: null,
                    components: ''
                },
            },
            userInfo: {
                userId: '',
                displayName: ''
            },
        };
    }

    let lineAdConfig = getInitialLineAdConfig();

    function updateLineAdConfig(updates) {
        if (updates.adInfo) {
            Object.assign(lineAdConfig.adInfo, updates.adInfo); // adInfo는 adInfo끼리 병합
        }
        
        if (updates.adParams) {
            if (updates.adParams.line) {
                Object.assign(lineAdConfig.adParams.line, updates.adParams.line); // adParams.line은 adParams.line끼리 병합
            }
            if (updates.adParams.wallet) {
                Object.assign(lineAdConfig.adParams.wallet, updates.adParams.wallet); // adParams.wallet은 adParams.wallet끼리 병합
            }
        }
        
        if (updates.userInfo) {
            Object.assign(lineAdConfig.userInfo, updates.userInfo); // userInfo는 userInfo끼리 병합
        }
        // console.log("settingOpenAds update:" , lineAdConfig);
    }

    window.settingOpenAds = async function(liffId, clientId, chainId, publisherId, userId, displayName) {
        console.log("settingOpenAds called");
        lineAdConfig = getInitialLineAdConfig(); 
        updateLineAdConfig({
            adInfo: { publisherId: publisherId },
            userInfo: { userId: userId, displayName: displayName }
        });

        if (!window.sdk) {
            const initialized = await window.initalizeSDK(liffId, clientId, chainId);
            if (!initialized) {
                console.log("Open Ads initialized is false!!!");
                return null;
            }
        }

        if (!liff.isInClient()) {
            console.log('OpenAds WEB3:' + liff.isInClient());
            const provider = window.sdk.getWalletProvider();
            updateLineAdConfig({
                adParams: {
                    line: { type: 'WEB3' },
                    wallet: {
                        type: 'kaia',
                        provider: provider,
                        components: 'dapp-portal-sdk'
                    }
                }
            });
        } else {
            console.log('OpenAds LIFF logged in');
            updateLineAdConfig({
                adParams: {
                    line: {
                        liffId: liffId,
                        prototype: window.liff
                    }
                }
            });
        }
        // console.log('OpenAds Id:' , lineAdConfig);

        // console.log("Setting OpenAds finished with current config:", JSON.stringify(lineAdConfig, null, 2));
        return true;
    };

    window.initBannerAds = async function(objectName, zoneId) {
        console.log("initBannerAds called");
        updateLineAdConfig({ adInfo: { zoneId: zoneId } });

        // console.log('OpenAds zoneId:' , lineAdConfig);

        const bannerElement = document.getElementById("open-ads-banner");
        if (bannerElement) {
            bannerElement.setAttribute('zoneId', zoneId);
            bannerElement.setAttribute('publisherId', lineAdConfig.adInfo.publisherId);

            console.log('OpenAds zoneId:' , lineAdConfig);

        
            await window.OpenADLineJsSDK.banner.init({ ...lineAdConfig });
            bannerElement.style.display = '';
            console.log("OpenAds banner init finish");
        } else {
            console.error("Error: Element with ID 'open-ads-banner' not found.");
        }
    };

    window.hideBannerAds = function() {
        console.log("hideBannerAds called"); 
        const bannerElement = document.getElementById("open-ads-banner");
        if (bannerElement) {
            bannerElement.style.display = 'none';
            console.log("OpenAds banner hide");
        } else {
            console.error("Error: Element with ID 'open-ads-banner' not found for hiding.");
        }
    };

    window.initInteractiveAds = async function(objectName, zoneId) {
        console.log("initInteractiveAds called");
        updateLineAdConfig({ adInfo: { zoneId: zoneId } });

        const currentLineType = lineAdConfig.adParams.line.type;
        let currentAdInfo = { 
            zoneId: lineAdConfig.adInfo.zoneId,
            publisherId: lineAdConfig.adInfo.publisherId,
        };

        const callbackFunc = {
            onAdResourceLoad: (e) => {
                console.log("OpenAds Load:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdResourceLoad', '' + e);
            },
            onAdOpening: (e) => {
                console.log("OpenAds opening:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdOpening', '' + e);
            },
            onAdOpened: (e) => {
                console.log("OpenAds opened:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdOpened', '' + e);
            },
            onAdTaskFinished: (e) => {
                console.log("OpenAds taskfinished:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdTaskFinished', '' + e);
            },
            onAdClosing: (e) => {
                console.log("OpenAds closing:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdClosing', '' + e);
            },
            onAdClosed: (e) => {
                console.log("OpenAds closed:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdClosed', '' + e);
            },
            onAdClick: (e) => {
                console.log("OpenAds click:", e);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdClick', '' + e);
            },
            
        };

        try {
            const initRes = await window.OpenADLineJsSDK.interactive.init({ ...lineAdConfig });

            if (initRes.code === 0) {
                console.log("OpenAds interactive init Success");
                const initData = initRes.data || {}; 
                const hash = initData.hash || null;
                const signature = initData.signature || null;
                const cb = initData.cb || null;
                let eventIdFromApi = initData.eventId || null; // API 응답에서 eventId를 가져옵니다.

                if (eventIdFromApi !== null) {
                    const parsedEventId = parseInt(eventIdFromApi, 10);
                    if (!isNaN(parsedEventId)) {
                        eventIdFromApi = parsedEventId;
                    } else {
                        eventIdFromApi = null;
                    }
                }
                const successData = {
                    zoneId: currentAdInfo.zoneId, 
                    publisherId: currentAdInfo.publisherId,
                    eventId: eventIdFromApi, 
                    hash: hash, 
                    signature: signature, 
                    cb: cb 
                };
                console.log("OpenAds interactive init Success:" + JSON.stringify(successData));
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdInitSuccess', '' + JSON.stringify(successData));
                

                if (currentLineType === 'WEB3') {
                    window.OpenADLineJsSDK.interactive.getRender({ adInfo: currentAdInfo, cb: callbackFunc });
                } else {
                    const clickReward = async () => {
                        let res = await getRewardsLevel2Method;
                        console.log('clickReward', res);
                    };
                    window.OpenADLineJsSDK.interactive.getRender({ adInfo: currentAdInfo, cb: callbackFunc, clickReward });
                }
            } else {
                console.log("OpenAds interactive init Fail:", initRes.code);
                if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdInitFail', 'err:' + initRes.code);
            }
        } catch (error) {
            console.error("Open Ads Error:", error);
            if (window.unityInstance) window.unityInstance.SendMessage(objectName, 'onAdInitFail', 'catch err:' + error.message);
        }
    };

})(); 
