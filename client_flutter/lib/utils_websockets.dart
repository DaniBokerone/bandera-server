import 'dart:convert';
import 'package:flutter/foundation.dart';             // kIsWeb
import 'package:web_socket_channel/web_socket_channel.dart';

enum ConnectionStatus { disconnected, disconnecting, connecting, connected }

class WebSocketsHandler {
  late Function _callback;
  String ip = "bandera5.ieti.site";
  String port = "443";
  String? socketId;

  WebSocketChannel? _socketClient;
  ConnectionStatus connectionStatus = ConnectionStatus.disconnected;


  void connectToServer(
    String serverIp,
    int serverPort,
    void Function(String message) callback, {
    void Function(dynamic error)? onError,
    void Function()? onDone,
  }) async {
    _callback = callback;
    ip   = serverIp;
    port = serverPort.toString();

    connectionStatus = ConnectionStatus.connecting;

    try {
      
      final Uri uri;
      if (kIsWeb) {
       
        final base   = Uri.base;                       
        final secure = base.scheme == 'https';
        uri = Uri(
          scheme: secure ? 'wss' : 'ws',
          host:   base.host,
          port:   base.hasPort ? base.port : null,
          queryParameters: {'role': 'spectator'},
        );
      } else {
        uri = Uri.parse('wss://$ip?role=spectator');
      }

      _socketClient = WebSocketChannel.connect(uri);
      connectionStatus = ConnectionStatus.connected;

      _socketClient!.stream.listen(
        (message) {
          _handleMessage(message);
          _callback(message);
        },
        onError: (error) {
          connectionStatus = ConnectionStatus.disconnected;
          onError?.call(error);
        },
        onDone: () {
          connectionStatus = ConnectionStatus.disconnected;
          onDone?.call();
        },
      );
    } catch (e) {
      connectionStatus = ConnectionStatus.disconnected;
      onError?.call(e);
    }
  }


  void _handleMessage(String message) {
    try {
      final data = jsonDecode(message);
      if (data is Map<String, dynamic> &&
          data["type"] == "welcome" &&
          data.containsKey("id")) {
        socketId = data["id"];
        if (kDebugMode) {
          print("Client ID asignado por el servidor: $socketId");
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print("Error procesando mensaje WebSocket: $e");
      }
    }
  }

  void sendMessage(String message) {
    if (connectionStatus == ConnectionStatus.connected) {
      _socketClient!.sink.add(message);
    }
  }

  void disconnectFromServer() {
    connectionStatus = ConnectionStatus.disconnecting;
    _socketClient?.sink.close();
    connectionStatus = ConnectionStatus.disconnected;
  }
}
