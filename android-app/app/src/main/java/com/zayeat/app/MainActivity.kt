package com.zayeat.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var refreshLayout: SwipeRefreshLayout
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
            val granted = result.values.any { it }
            geoCallback?.invoke(geoOrigin, granted, false)
            geoCallback = null
            geoOrigin = null
        }

    companion object {
        private const val SITE_URL = "https://mhtiger0903727-ux.github.io/Zayeat/"
        private const val FILE_CHOOSER_REQUEST = 4102
        private const val SITE_HOST = "mhtiger0903727-ux.github.io"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(16, 76, 43)
        window.navigationBarColor = android.graphics.Color.rgb(12, 54, 30)

        refreshLayout = SwipeRefreshLayout(this).apply {
            setColorSchemeColors(android.graphics.Color.rgb(35, 133, 74))
            setProgressBackgroundColorSchemeColor(android.graphics.Color.WHITE)
        }

        webView = WebView(this)
        refreshLayout.addView(
            webView,
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(refreshLayout)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            allowFileAccess = true
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
        }

        CookieManager.getInstance().setAcceptCookie(true)

        refreshLayout.setOnRefreshListener {
            if (webView.url == null) webView.loadUrl(SITE_URL) else webView.reload()
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                refreshLayout.isRefreshing = true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                refreshLayout.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: android.webkit.WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    refreshLayout.isRefreshing = false
                    Toast.makeText(
                        this@MainActivity,
                        "اتصال اینترنت را بررسی کنید و صفحه را دوباره بارگذاری کنید.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                return when (uri.scheme) {
                    "tel", "mailto" -> {
                        runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                            .onFailure {
                                Toast.makeText(this@MainActivity, "برنامه‌ای برای این کار پیدا نشد", Toast.LENGTH_SHORT).show()
                            }
                        true
                    }
                    "https", "http" -> {
                        val host = uri.host.orEmpty()
                        val belongsToOnlineSite = host == SITE_HOST ||
                            host == "unpkg.com" ||
                            host == "fonts.googleapis.com" ||
                            host == "fonts.gstatic.com" ||
                            host == "supabase.co" ||
                            host.endsWith(".supabase.co") ||
                            host == "openstreetmap.org" ||
                            host.endsWith(".openstreetmap.org")

                        if (belongsToOnlineSite) {
                            false
                        } else {
                            runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                            true
                        }
                    }
                    else -> true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                return try {
                    val intent = fileChooserParams?.createIntent()
                        ?: Intent(Intent.ACTION_GET_CONTENT).apply { type = "*/*" }
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST)
                    true
                } catch (_: Exception) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    false
                }
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                val fine = ContextCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val coarse = ContextCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (fine || coarse) {
                    callback?.invoke(origin, true, false)
                } else {
                    geoOrigin = origin
                    geoCallback = callback
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl(SITE_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    @Deprecated("Legacy activity result API is required by WebChromeClient file chooser")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST) {
            val result = if (resultCode == Activity.RESULT_OK) {
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            } else null
            filePathCallback?.onReceiveValue(result)
            filePathCallback = null
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        webView.destroy()
        super.onDestroy()
    }
}
