class Node:
    def __init__(self, node_id, node_type, capacity, base_latency):
        self.node_id = node_id
        self.node_type = node_type
        self.capacity = capacity
        self.base_latency = base_latency

        self.current_load = 0
        self.latency = base_latency
        self.error_rate = 0
        self.status = "Healthy"

    def process_traffic(self, incoming_rps):
        self.current_load = incoming_rps

        if self.capacity == 0:
            self.status = "Overloaded"
            self.latency = 9999
            self.error_rate = 1
            return

        utilization = incoming_rps / self.capacity

        if utilization < 1:
            # Queue delay model (M/M/1 inspired)
            self.latency = self.base_latency / (1 - utilization)
            self.error_rate = 0
            self.status = "Healthy"
        else:
            # Overload behavior
            self.latency = self.base_latency * utilization * 5
            self.error_rate = min((incoming_rps - self.capacity) / incoming_rps, 1)
            self.status = "Overloaded"
