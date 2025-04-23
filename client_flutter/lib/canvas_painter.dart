import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'app_data.dart';

class CanvasPainter extends CustomPainter {
  final AppData appData;
  final dynamic gameData;

  CanvasPainter(this.appData, this.gameData);

  @override
  void paint(Canvas canvas, ui.Size size) {
    final gameState = appData.gameState;
    if (gameState.isEmpty) return;

  
    final backgroundPaint = Paint()..color = const ui.Color.fromARGB(255, 33, 229, 243);
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), backgroundPaint);

   
    if (gameState["players"] != null) {
      for (var player in gameState["players"]) {
        final x = player["x"] * size.width;
        final y = player["y"] * size.height;
        final rect = Rect.fromLTWH(x, y, 30, 30);
        final paint = Paint()..color = Colors.black;
        canvas.drawRect(rect, paint);
      }
    }

    
    if (gameState["flagPos"] != null) {
      final fx = gameState["flagPos"]["dx"] * size.width;
      final fy =  gameState["flagPos"]["dy"] * size.height;
      final flagRect = Rect.fromLTWH(fx, fy, 30, 30);
      final flagPaint = Paint()..color = Colors.yellow;
      canvas.drawRect(flagRect, flagPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
