from models import Node


class SimulationEngine:
    def __init__(self, blueprint):
        self.nodes = []
        self.build_system(blueprint)

    def build_system(self, blueprint):
        base_latency_map = {
            "load_balancer": 5,
            "app_server": 10,
            "database": 20,
            "cache": 2
        }

        for node in blueprint["nodes"]:
            new_node = Node(
                node_id=node["id"],
                node_type=node["type"],
                capacity=node["capacity"],
                base_latency=base_latency_map[node["type"]]
            )
            self.nodes.append(new_node)

    def run_simulation(self, traffic_rps, read_ratio=0.95, cache_hit_ratio=0.8):

        reads = traffic_rps * read_ratio
        writes = traffic_rps * (1 - read_ratio)

        cache_hits = reads * cache_hit_ratio
        cache_miss = reads - cache_hits

        db_traffic = cache_miss + writes

        system_failed = False

        # Load Balancer
        lb_nodes = [n for n in self.nodes if n.node_type == "load_balancer"]
        for node in lb_nodes:
            node.process_traffic(traffic_rps)

        # App Servers (Horizontal scaling)
        app_nodes = [n for n in self.nodes if n.node_type == "app_server"]
        app_count = len(app_nodes)

        if app_count > 0:
            app_traffic_per_instance = traffic_rps / app_count
            for node in app_nodes:
                node.process_traffic(app_traffic_per_instance)

        # Cache
        cache_nodes = [n for n in self.nodes if n.node_type == "cache"]
        for node in cache_nodes:
            node.process_traffic(reads)

        # Database
        db_nodes = [n for n in self.nodes if n.node_type == "database"]
        db_count = len(db_nodes)

        if db_count > 0:
            db_traffic_per_instance = db_traffic / db_count
            for node in db_nodes:
                node.process_traffic(db_traffic_per_instance)

                if node.status == "Overloaded":
                    system_failed = True

        total_latency = sum(node.latency for node in self.nodes)

        return {
            "system_status": "Failed" if system_failed else "Running",
            "total_latency": round(total_latency, 2),
            "db_traffic": round(db_traffic, 2),
            "nodes": [
                {
                    "id": node.node_id,
                    "type": node.node_type,
                    "load": round(node.current_load, 2),
                    "latency": round(node.latency, 2),
                    "error_rate": round(node.error_rate, 3),
                    "status": node.status
                }
                for node in self.nodes
            ]
        }
