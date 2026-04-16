import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var webViewModel = WebViewModel()

    var body: some View {
        ZStack {
            Color(red: 0.094, green: 0.094, blue: 0.106) // #18181b
                .ignoresSafeArea()

            WebView(viewModel: webViewModel)
                .ignoresSafeArea()

            if webViewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Color(red: 0.902, green: 0.659, blue: 0.090)))
                    .scaleEffect(1.5)
            }

            if let error = webViewModel.error {
                VStack(spacing: 16) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("Verbindungsfehler")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Button("Erneut versuchen") {
                        webViewModel.retry()
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color(red: 0.902, green: 0.659, blue: 0.090))
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                .padding()
            }
        }
    }
}

class WebViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var error: String?
    var webView: WKWebView?
    let url = URL(string: "https://uhren-mu.vercel.app/dashboard")!

    func retry() {
        error = nil
        isLoading = true
        webView?.load(URLRequest(url: url))
    }
}

struct WebView: UIViewRepresentable {
    @ObservedObject var viewModel: WebViewModel

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.094, green: 0.094, blue: 0.106, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = context.coordinator

        // Use Safari user agent — Google blocks OAuth from default WKWebView user agent
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

        viewModel.webView = webView
        webView.load(URLRequest(url: viewModel.url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        let viewModel: WebViewModel

        init(viewModel: WebViewModel) {
            self.viewModel = viewModel
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = true
                self.viewModel.error = nil
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.viewModel.error = error.localizedDescription
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.viewModel.error = error.localizedDescription
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               let host = url.host {
                // Allow our domain + all Google domains (OAuth uses many subdomains)
                if host.contains("uhren-mu.vercel.app") ||
                   host.contains("localhost") ||
                   host.hasSuffix("google.com") ||
                   host.hasSuffix("googleapis.com") ||
                   host.hasSuffix("gstatic.com") ||
                   host.hasSuffix("googleusercontent.com") ||
                   host.hasSuffix("youtube.com") ||
                   host.hasSuffix("google.de") {
                    decisionHandler(.allow)
                    return
                }
                // Block everything else — open in Safari
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}

#Preview {
    ContentView()
}
