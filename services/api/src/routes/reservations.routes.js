const express = require("express");
const ReservationService = require("../services/reservation.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const reservationService = new ReservationService();
const ALLOWED_ROLES = new Set(["admin", "customer"]);

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !ALLOWED_ROLES.has(role) || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

/**
 * @openapi
 * /api/reservations:
 *   get:
 *     summary: Listar reservaciones
 *     description: Retorna una lista de todas las reservaciones. Solo admins ven todas. Customers ven solo sus propias.
 *     tags:
 *       - Reservaciones
 *     security:
 *       - bearerAuth: []
 */
router.get("/", auth, async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    let data;
    if (userRole === "admin") {
      data = await reservationService.listReservations();
    } else {
      data = await reservationService.getUserReservations(userId);
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/reservations/{id}:
 *   get:
 *     summary: Obtener reservación por ID
 *     description: Retorna una reservación específica. Customers solo pueden ver sus propias.
 *     tags:
 *       - Reservaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const data = await reservationService.getReservation(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Customers solo pueden ver sus propias reservaciones
    if (userRole !== "admin" && data.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     summary: Crear reservación
 *     description: Crea una nueva reservación. Solo clientes autenticados.
 *     tags:
 *       - Reservaciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantId:
 *                 type: string
 *               reservationDate:
 *                 type: string
 *                 format: date-time
 *               partySize:
 *                 type: integer
 *               specialRequests:
 *                 type: string
 */
router.post("/", auth, requireRole(["customer"]), async (req, res) => {
  try {
    const payload = {
      userId: req.user?.sub,
      ...req.body
    };
    const created = await reservationService.createReservation(payload);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/reservations/{id}:
 *   put:
 *     summary: Actualizar reservación
 *     description: Actualiza una reservación. Customers solo pueden actualizar sus propias.
 *     tags:
 *       - Reservaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const reservation = await reservationService.getReservation(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Customers solo pueden actualizar sus propias
    if (userRole !== "admin" && reservation.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await reservationService.updateReservation(req.params.id, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/reservations/{id}:
 *   delete:
 *     summary: Eliminar reservación
 *     description: Elimina una reservación. Customers solo pueden eliminar las suyas.
 *     tags:
 *       - Reservaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const reservation = await reservationService.getReservation(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Customers solo pueden eliminar las suyas
    if (userRole !== "admin" && reservation.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await reservationService.deleteReservation(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    return res.status(200).json({ message: "Reservation deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
