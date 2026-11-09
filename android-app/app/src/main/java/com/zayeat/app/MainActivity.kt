package com.zayeat.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    companion object {
        private const val SITE_URL = "https://mhtiger0903727-ux.github.io/Zayeat/"
        private const val FILE_CHOOSER_REQUEST = 4102
        private const val LOCATION_REQUEST = 4103
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(27, 94, 32)
        window.navigationBarColor = android.graphics.Color.rgb(18, 63, 24)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            geolocationEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            loadWithOverviewMode = true
            useWideViewPort = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                return when (uri.scheme) {
                    "tel", "mailto" -> {
                        runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                            .onFailure { Toast.makeText(this@MainActivity, "برنامه‌ای برای این کار پیدا نشد", Toast.LENGTH_SHORT).show() }
                        true
                    }
                    "https", "http" -> {
                        if (uri.host == "mhtiger0903727-ux.github.io" || uri.host == "unpkg.com" ||
                            uri.host == "fonts.googleapis.com" || uri.host == "fonts.gstatic.com" ||
                            uri.host == "supabase.co" || uri.host?.endsWith(".supabase.co") == true ||
                            uri.host == "openstreetmap.org" || uri.host?.endsWith(".openstreetmap.org") == true) {
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
                val fine = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val coarse = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (fine || coarse) {
                    callback?.invoke(origin, true, false)
                } else {
                    geoOrigin = origin
                    geoCallback = callback
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
                        LOCATION_REQUEST
                    )
                }
            }
        }

        if (savedInstanceState == null) webView.loadUrl(SITE_URL)
        else webView.restoreState(savedInstanceState)

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

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_REQUEST) {
            val granted = grantResults.any { it == PackageManager.PERMISSION_GRANTED }
            geoCallback?.invoke(geoOrigin, granted, false)
            geoCallback = null
            geoOrigin = null
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
